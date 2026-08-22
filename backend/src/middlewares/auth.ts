import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/db';

export interface AuthUserPayload {
  userId: number;
  email: string;
  name: string;
  roleId: number;
  roleName: string;
  department?: string | null;
  microsoftId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role.roleName,
      department: user.department,
      microsoftId: user.microsoftId,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * Optional authentication middleware for guest/public endpoints
 * Populates req.user if a valid token is present, but doesn't block if missing.
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (user) {
      req.user = {
        userId: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role.roleName,
        department: user.department,
        microsoftId: user.microsoftId,
      };
    }
  } catch {
    // Ignore invalid token in optional auth
  }

  next();
};
