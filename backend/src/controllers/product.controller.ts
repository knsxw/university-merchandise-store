import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateProductDescription } from '../services/ai.service';
import { parseFiniteNumber, parseInteger } from '../utils/validation';

/**
 * Get all products with optional category, search, and department filters
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, search, department } = req.query;

    const where: any = {};

    if (categoryId) {
      const parsedCategoryId = parseInteger(categoryId, { min: 1 });
      if (parsedCategoryId === null) {
        res.status(400).json({ error: 'categoryId must be a positive integer' });
        return;
      }
      where.categoryId = parsedCategoryId;
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
    const id = parseInteger(req.params.id, { min: 1 });
    if (id === null) {
      res.status(400).json({ error: 'Product ID must be a positive integer' });
      return;
    }

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

    if (typeof name !== 'string' || name.trim() === '' || price === undefined || categoryId === undefined) {
      res.status(400).json({ error: 'Missing required fields: name, price, categoryId' });
      return;
    }

    const parsedPrice = parseFiniteNumber(price, { min: 0 });
    const parsedStock = parseInteger(stock ?? 0, { min: 0 });
    const parsedCategoryId = parseInteger(categoryId, { min: 1 });
    const parsedDiscount = parseFiniteNumber(discountPct ?? 0, { min: 0, max: 100 });
    if (parsedPrice === null || parsedStock === null || parsedCategoryId === null || parsedDiscount === null) {
      res.status(400).json({
        error: 'price and stock must be non-negative numbers, categoryId must be a positive integer, and discountPct must be between 0 and 100',
      });
      return;
    }
    if (description !== undefined && typeof description !== 'string') {
      res.status(400).json({ error: 'description must be a string' });
      return;
    }

    const category = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
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
        name: name.trim(),
        description: finalDescription,
        price: parsedPrice,
        stock: parsedStock,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        department: department || null,
        discountPct: parsedDiscount,
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
    const id = parseInteger(req.params.id, { min: 1 });
    const { name, description, price, stock, categoryId, imageUrl, department, discountPct } = req.body;

    if (id === null) {
      res.status(400).json({ error: 'Product ID must be a positive integer' });
      return;
    }

    const data: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'name must be a non-empty string' });
        return;
      }
      data.name = name.trim();
    }
    if (description !== undefined) {
      if (typeof description !== 'string') {
        res.status(400).json({ error: 'description must be a string' });
        return;
      }
      data.description = description;
    }
    if (price !== undefined) {
      const parsed = parseFiniteNumber(price, { min: 0 });
      if (parsed === null) {
        res.status(400).json({ error: 'price must be a non-negative number' });
        return;
      }
      data.price = parsed;
    }
    if (stock !== undefined) {
      const parsed = parseInteger(stock, { min: 0 });
      if (parsed === null) {
        res.status(400).json({ error: 'stock must be a non-negative integer' });
        return;
      }
      data.stock = parsed;
    }
    if (categoryId !== undefined) {
      const parsed = parseInteger(categoryId, { min: 1 });
      if (parsed === null) {
        res.status(400).json({ error: 'categoryId must be a positive integer' });
        return;
      }
      data.categoryId = parsed;
    }
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (department !== undefined) data.department = department;
    if (discountPct !== undefined) {
      const parsed = parseFiniteNumber(discountPct, { min: 0, max: 100 });
      if (parsed === null) {
        res.status(400).json({ error: 'discountPct must be between 0 and 100' });
        return;
      }
      data.discountPct = parsed;
    }

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
    const id = parseInteger(req.params.id, { min: 1 });
    if (id === null) {
      res.status(400).json({ error: 'Product ID must be a positive integer' });
      return;
    }

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
