import { Request, Response } from 'express';
import prisma from '../config/db';
import { parseInteger } from '../utils/validation';

/**
 * Get all users with roles (Admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: (error as Error).message });
  }
};

/**
 * Update user role or department (Admin only)
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInteger(req.params.id, { min: 1 });
    const { roleId, department } = req.body;

    if (id === null) {
      res.status(400).json({ error: 'User ID must be a positive integer' });
      return;
    }

    const data: any = {};
    if (roleId !== undefined) {
      const parsedRoleId = parseInteger(roleId, { min: 1 });
      if (parsedRoleId === null) {
        res.status(400).json({ error: 'roleId must be a positive integer' });
        return;
      }
      data.roleId = parsedRoleId;
    }
    if (department !== undefined) data.department = department;

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: (error as Error).message });
  }
};

/**
 * Get all available roles in the system
 */
export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany();
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles', details: (error as Error).message });
  }
};
