import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose';
import { config, isEntraConfigured } from '../config/env';
import prisma from '../config/db';

export const generateToken = (user: {
  id: number;
  email: string;
  name: string;
  roleId: number;
  role: { roleName: string };
  department?: string | null;
  microsoftId?: string | null;
}) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.roleName,
      department: user.department,
      microsoftId: user.microsoftId,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
};

/**
 * Microsoft Entra ID Login
 * Verifies the ID token issued by the university tenant (signature via tenant JWKS,
 * issuer, audience, expiry), then creates or syncs the local user and issues an app JWT.
 */
interface EntraIdTokenClaims {
  oid?: string;
  tid?: string;
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  department?: string;
  extension_department?: string;
}

// Special tenant keywords that cannot be used to pin an issuer
const BUILTIN_TENANTS = new Set(['common', 'organizations', 'consumers']);

// Remote JWKS clients are cached per tenant so keys are fetched once per process
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const getTenantJwks = (tenantId: string) => {
  if (!jwksCache.has(tenantId)) {
    const jwksUrl = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
    jwksCache.set(tenantId, createRemoteJWKSet(new URL(jwksUrl)));
  }
  return jwksCache.get(tenantId)!;
};

const resolveTenant = (tokenTenant?: string): string | null => {
  const configured = config.azureTenantId && !config.azureTenantId.includes('here')
    ? config.azureTenantId
    : undefined;

  // Specific university tenant: the token must come from it
  if (configured && !BUILTIN_TENANTS.has(configured)) {
    return tokenTenant === configured ? configured : null;
  }
  // Unconfigured / multi-tenant app: trust the token's own tenant claim
  return tokenTenant || configured || null;
};

const resolveRoleId = async (roleName: 'Admin' | 'Student'): Promise<number | null> => {
  const role = await prisma.role.findUnique({ where: { roleName } });
  return role?.id ?? null;
};

export const microsoftLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, microsoftId, email, name, department } = req.body;

    // ---- Real Entra ID flow: verify the ID token -------------------------
    if (idToken) {
      if (!isEntraConfigured()) {
        res.status(503).json({ error: 'Microsoft Entra ID is not configured on the server (missing AZURE_CLIENT_ID).' });
        return;
      }

      let peeked: EntraIdTokenClaims;
      try {
        peeked = decodeJwt(idToken) as EntraIdTokenClaims;
      } catch {
        res.status(401).json({ error: 'Malformed ID token.' });
        return;
      }

      const tenant = resolveTenant(peeked.tid);
      if (!tenant) {
        res.status(401).json({ error: `ID token was issued by tenant "${peeked.tid}", which is not the configured university tenant.` });
        return;
      }

      let claims: EntraIdTokenClaims;
      try {
        const verified = await jwtVerify<EntraIdTokenClaims>(idToken, getTenantJwks(tenant), {
          issuer: `https://login.microsoftonline.com/${tenant}/v2.0`,
          audience: config.azureClientId,
          clockTolerance: 60,
        });
        claims = verified.payload;
      } catch (error) {
        res.status(401).json({ error: 'Invalid or expired Entra ID token.', details: (error as Error).message });
        return;
      }

      const tokenEmail = claims.email || claims.preferred_username;
      if (!tokenEmail || !tokenEmail.includes('@')) {
        res.status(401).json({ error: 'ID token has no usable email claim (ensure User.Read scope and email claim are issued).' });
        return;
      }

      const normalizedEmail = tokenEmail.toLowerCase();
      const isAdmin = config.adminEmails.includes(normalizedEmail);
      const roleId = await resolveRoleId(isAdmin ? 'Admin' : 'Student');
      if (!roleId) {
        res.status(500).json({ error: 'Roles are missing in the database. Run `npx prisma db seed` first.' });
        return;
      }

      // Department from an optional Entra extension claim; admin-set value is preserved on re-login
      const tokenDepartment = claims.department || claims.extension_department || null;

      const user = await prisma.user.upsert({
        where: { email: tokenEmail },
        update: {
          name: claims.name || normalizedEmail.split('@')[0],
          microsoftId: claims.oid || claims.sub || microsoftId || undefined,
          // Promote allowlisted accounts even when they logged in previously as
          // Students. Non-allowlisted users keep roles assigned by an Admin.
          ...(isAdmin ? { roleId } : {}),
        },
        create: {
          email: tokenEmail,
          name: claims.name || normalizedEmail.split('@')[0],
          microsoftId: claims.oid || claims.sub || `ms-${Date.now()}`,
          roleId,
          department: tokenDepartment || 'General',
        },
        include: { role: true },
      });

      const token = generateToken(user);
      res.json({
        message: 'Microsoft Entra ID authentication successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.roleName,
          department: user.department,
          microsoftId: user.microsoftId,
        },
      });
      return;
    }

    // ---- Legacy profile exchange (DEV ONLY) ------------------------------
    // Only available while Entra ID is unconfigured, so local development
    // without an Azure app registration keeps working.
    if (config.nodeEnv === 'production') {
      res.status(403).json({ error: 'Unverified profile login is disabled in production. Use Microsoft Entra ID login.' });
      return;
    }

    if (!email || !name) {
      res.status(400).json({
        error: isEntraConfigured()
          ? 'This server requires a verified Entra ID token. Send { idToken } from the MSAL login result.'
          : 'Email and Name are required from the Entra ID payload',
      });
      return;
    }

    if (isEntraConfigured()) {
      res.status(400).json({ error: 'Unverified profile login is disabled while Entra ID is configured. Send { idToken } instead.' });
      return;
    }

    console.warn(`⚠️  DEV-ONLY unverified profile exchange for ${email}. Configure AZURE_* to enforce real Entra ID login.`);

    const defaultRoleId = await resolveRoleId('Student');
    if (!defaultRoleId) {
      res.status(500).json({ error: 'Roles are missing in the database. Run `npx prisma db seed` first.' });
      return;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        microsoftId: microsoftId || undefined,
        department: department || undefined,
      },
      create: {
        email,
        name,
        microsoftId: microsoftId || `ms-${Date.now()}`,
        roleId: defaultRoleId,
        department: department || 'General',
      },
      include: { role: true },
    });

    const token = generateToken(user);

    res.json({
      message: 'Authentication successful (dev mode)',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.roleName,
        department: user.department,
        microsoftId: user.microsoftId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process Entra ID login', details: (error as Error).message });
  }
};

/**
 * Dev Switcher Login - Instant role switching for development and testing
 */
export const devLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (config.nodeEnv === 'production' || isEntraConfigured()) {
      res.status(403).json({ error: 'Dev login is disabled while Microsoft Entra ID login is active.' });
      return;
    }

    const { roleName, email } = req.body;

    let targetEmail = email;
    if (!targetEmail) {
      if (roleName === 'Admin') targetEmail = 'admin@university.edu';
      else if (roleName === 'Staff') targetEmail = 'staff@university.edu';
      else targetEmail = 'khine.k@student.university.edu';
    }

    const user = await prisma.user.findFirst({
      where: { email: targetEmail },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: `User with email ${targetEmail} not found. Run seed script first.` });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: `Switched to role ${user.role.roleName}`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.roleName,
        department: user.department,
        microsoftId: user.microsoftId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Dev login failed', details: (error as Error).message });
  }
};

/**
 * Get current logged in user profile
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.roleName,
        department: user.department,
        microsoftId: user.microsoftId,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user profile', details: (error as Error).message });
  }
};
