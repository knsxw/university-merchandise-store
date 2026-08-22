import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * Get current user's cart with items and subtotal
 */
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    let cart = await prisma.cart.findUnique({
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
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });
    }

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      cart: {
        id: cart.id,
        items: cart.items,
        itemCount,
        subtotal: parseFloat(subtotal.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart', details: (error as Error).message });
  }
};

/**
 * Add an item to user's cart or increment quantity
 */
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'productId is required' });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (qty <= 0) {
      res.status(400).json({ error: 'Quantity must be at least 1' });
      return;
    }

    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId, 10) },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.stock < qty) {
      res.status(400).json({ error: `Not enough stock. Available: ${product.stock}` });
      return;
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (product.stock < newQty) {
        res.status(400).json({ error: `Cannot add more. Max stock available: ${product.stock}` });
        return;
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: qty,
        },
      });
    }

    res.json({ message: 'Item added to cart successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart', details: (error as Error).message });
  }
};

/**
 * Update quantity of a cart item
 */
export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.itemId, 10);
    const { quantity } = req.body;

    const qty = parseInt(quantity, 10);
    if (qty < 0) {
      res.status(400).json({ error: 'Quantity must be 0 or positive' });
      return;
    }

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    if (qty === 0) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });
      res.json({ message: 'Item removed from cart' });
      return;
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true },
    });

    if (!cartItem) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    if (cartItem.product.stock < qty) {
      res.status(400).json({ error: `Not enough stock. Available: ${cartItem.product.stock}` });
      return;
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: qty },
    });

    res.json({ message: 'Cart item updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart item', details: (error as Error).message });
  }
};

/**
 * Remove an item from the cart
 */
export const removeCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const itemId = parseInt(req.params.itemId, 10);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      res.status(404).json({ error: 'Cart not found' });
      return;
    }

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove cart item', details: (error as Error).message });
  }
};

/**
 * Clear all items in cart
 */
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart', details: (error as Error).message });
  }
};
