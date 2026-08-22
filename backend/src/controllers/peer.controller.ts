import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * Exposed Peer API: GET /api/products/available
 * Protected by x-api-key header
 * Returns available merchandise products for partner university systems
 */
export const getAvailableProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        department: true,
        discountPct: true,
      },
      orderBy: { id: 'asc' },
    });

    // Format response matching project proposal contract
    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      price: Number(p.price),
      department: p.department || undefined,
      discountPct: p.discountPct ? Number(p.discountPct) : undefined,
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch available products for peer API',
      details: (error as Error).message,
    });
  }
};
