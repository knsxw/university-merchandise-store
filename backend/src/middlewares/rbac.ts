import { Request, Response, NextFunction } from 'express';

/**
 * Role-Based Access Control Middleware
 * Restricts access to users with specified role names (e.g. 'Admin', 'Staff', 'Student')
 */
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to roles: [${allowedRoles.join(', ')}]. Your role is: ${req.user.roleName}`,
      });
      return;
    }

    next();
  };
};
