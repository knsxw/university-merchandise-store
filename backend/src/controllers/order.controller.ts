import { Request, Response } from 'express';
import prisma from '../config/db';
import { verifyDepartmentEligibility } from '../services/peer.service';

/**
 * Checkout user's cart and create an order
 * Integrates Peer API department check for department discounts
 */
export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: 'Cannot checkout with an empty cart' });
      return;
    }

    // Verify stock availability for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for product "${item.product.name}". Available: ${item.product.stock}`,
        });
        return;
      }
    }

    let calculatedTotal = 0;
    let totalDiscountApplied = 0;
    const orderItemsToCreate: Array<{
      productId: number;
      quantity: number;
      price: number;
    }> = [];

    // Calculate pricing with Peer API department discount verification
    for (const item of cart.items) {
      const originalPrice = Number(item.product.price);
      let unitPrice = originalPrice;
      const discountPct = Number(item.product.discountPct || 0);

      if (discountPct > 0 && item.product.department) {
        // Query Peer API with studentId / student department
        const studentId = user.microsoftId || user.email;
        const eligibility = await verifyDepartmentEligibility(
          studentId,
          item.product.department
        );

        if (eligibility.isEligible) {
          const discountAmount = (originalPrice * discountPct) / 100;
          unitPrice = originalPrice - discountAmount;
          totalDiscountApplied += discountAmount * item.quantity;
        }
      }

      const lineTotal = unitPrice * item.quantity;
      calculatedTotal += lineTotal;

      orderItemsToCreate.push({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(unitPrice.toFixed(2)),
      });
    }

    // Execute atomic transaction for order creation, stock deduction, and cart cleanup
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalPrice: parseFloat(calculatedTotal.toFixed(2)),
          discountApplied: parseFloat(totalDiscountApplied.toFixed(2)),
          status: 'PENDING',
          items: {
            create: orderItemsToCreate,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // 2. Decrement stock for purchased products
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ error: 'Checkout failed', details: (error as Error).message });
  }
};

/**
 * Get logged in user's order history
 */
export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order history', details: (error as Error).message });
  }
};

/**
 * Get all orders in system (Admin & Staff)
 */
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, department: true },
        },
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    res.json({
      orders,
      summary: {
        totalOrders: orders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all orders', details: (error as Error).message });
  }
};

/**
 * Update order status (Admin & Staff)
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status', details: (error as Error).message });
  }
};
