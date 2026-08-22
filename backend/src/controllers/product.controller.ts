import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateProductDescription } from '../services/ai.service';

/**
 * Get all products with optional category, search, and department filters
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, search, department } = req.query;

    const where: any = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string, 10);
    }

    if (department) {
      where.department = department as string;
    }

    if (search) {
      const searchTerm = search as string;
      where.OR = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: (error as Error).message });
  }
};

/**
 * Get single product by ID
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product', details: (error as Error).message });
  }
};

/**
 * Create new merchandise item (Admin / Staff)
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, stock, categoryId, imageUrl, department, discountPct, useAiDescription } = req.body;

    if (!name || price === undefined || !categoryId) {
      res.status(400).json({ error: 'Missing required fields: name, price, categoryId' });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId, 10) },
    });

    if (!category) {
      res.status(400).json({ error: 'Invalid categoryId provided' });
      return;
    }

    let finalDescription = description;

    // Use AI to generate or enhance description if requested or if empty
    if (useAiDescription || !description || description.trim() === '') {
      finalDescription = await generateProductDescription({
        productName: name,
        categoryName: category.name,
        department,
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description: finalDescription,
        price: parseFloat(price),
        stock: parseInt(stock || '0', 10),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        department: department || null,
        discountPct: discountPct ? parseFloat(discountPct) : 0.0,
        categoryId: category.id,
        createdBy: req.user?.userId || null,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: (error as Error).message });
  }
};

/**
 * Update existing product (Admin / Staff)
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, price, stock, categoryId, imageUrl, department, discountPct } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = parseFloat(price);
    if (stock !== undefined) data.stock = parseInt(stock, 10);
    if (categoryId !== undefined) data.categoryId = parseInt(categoryId, 10);
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (department !== undefined) data.department = department;
    if (discountPct !== undefined) data.discountPct = parseFloat(discountPct);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product', details: (error as Error).message });
  }
};

/**
 * Delete product (Admin / Staff)
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product', details: (error as Error).message });
  }
};

/**
 * Generate AI product description preview
 */
export const generateAiDescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productName, categoryName, department, keywords } = req.body;

    if (!productName) {
      res.status(400).json({ error: 'productName is required' });
      return;
    }

    const description = await generateProductDescription({
      productName,
      categoryName,
      department,
      keywords,
    });

    res.json({ description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate AI description', details: (error as Error).message });
  }
};

/**
 * Get all product categories
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories', details: (error as Error).message });
  }
};
