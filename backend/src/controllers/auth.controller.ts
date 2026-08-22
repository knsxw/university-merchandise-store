import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
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
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Microsoft Entra ID Login / Token Exchange
 * In production: validates Azure AD ID token and creates or syncs local user.
 */
export const microsoftLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { microsoftId, email, name, department } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: 'Email and Name are required from Entra ID payload' });
      return;
    }

    // Default role: Student (roleId: 3) if not existing, or match email pattern for admin/staff
    let defaultRoleId = 3;
    if (email.startsWith('admin@')) defaultRoleId = 1;
    else if (email.startsWith('staff@')) defaultRoleId = 2;

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
      message: 'Authentication successful',
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
