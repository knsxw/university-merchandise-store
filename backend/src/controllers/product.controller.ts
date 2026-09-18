import { Request, Response } from 'express';
import prisma from '../config/db';
import { generateProductDescription } from '../services/ai.service';
import { parseFiniteNumber, parseInteger } from '../utils/validation';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';

type BulkProductError = {
  row: number;
  field: string;
  message: string;
};

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
        imageUrl: imageUrl || DEFAULT_PRODUCT_IMAGE,
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
 * Create multiple merchandise items in one atomic import (Admin / Staff)
 */
export const bulkCreateProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = req.body?.products;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: 'At least one product row is required' });
      return;
    }

    if (products.length > 500) {
      res.status(400).json({ error: 'A single import can contain at most 500 products' });
      return;
    }

    const categories = await prisma.category.findMany();
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const categoriesByName = new Map(
      categories.map((category) => [category.name.trim().toLocaleLowerCase(), category])
    );
    const errors: BulkProductError[] = [];

    const validatedProducts = products.map((product: any, index: number) => {
      const row = parseInteger(product?.row, { min: 2 }) ?? index + 2;
      const name = typeof product?.name === 'string' ? product.name.trim() : '';
      const description = typeof product?.description === 'string' ? product.description.trim() : '';
      const price = parseFiniteNumber(product?.price, { min: 0 });
      const stock = parseInteger(product?.stock ?? 0, { min: 0 });
      const discountPct = parseFiniteNumber(product?.discountPct ?? 0, { min: 0, max: 100 });
      const categoryId = parseInteger(product?.categoryId, { min: 1 });
      const categoryName = typeof product?.category === 'string' ? product.category.trim() : '';
      const category =
        (categoryId !== null ? categoriesById.get(categoryId) : undefined) ||
        (categoryName ? categoriesByName.get(categoryName.toLocaleLowerCase()) : undefined);

      if (!name) errors.push({ row, field: 'name', message: 'Product name is required' });
      if (name.length > 191) errors.push({ row, field: 'name', message: 'Product name must be 191 characters or fewer' });
      if (price === null) errors.push({ row, field: 'price', message: 'Price must be a non-negative number' });
      if (stock === null) errors.push({ row, field: 'stock', message: 'Stock must be a non-negative whole number' });
      if (discountPct === null) errors.push({ row, field: 'discountPct', message: 'Discount must be between 0 and 100' });
      if (!category) errors.push({ row, field: 'category', message: 'Category name or ID does not match an existing category' });
      if (product?.imageUrl !== undefined && typeof product.imageUrl !== 'string') {
        errors.push({ row, field: 'imageUrl', message: 'Image URL must be text' });
      }
      if (typeof product?.imageUrl === 'string' && product.imageUrl.trim().length > 191) {
        errors.push({ row, field: 'imageUrl', message: 'Image URL must be 191 characters or fewer' });
      }
      if (product?.department !== undefined && typeof product.department !== 'string') {
        errors.push({ row, field: 'department', message: 'Department must be text' });
      }
      if (typeof product?.department === 'string' && product.department.trim().length > 191) {
        errors.push({ row, field: 'department', message: 'Department must be 191 characters or fewer' });
      }

      return {
        name,
        description: description || `Official university merchandise: ${name}.`,
        price: price ?? 0,
        stock: stock ?? 0,
        categoryId: category?.id ?? 0,
        imageUrl: typeof product?.imageUrl === 'string' && product.imageUrl.trim()
          ? product.imageUrl.trim()
          : DEFAULT_PRODUCT_IMAGE,
        department: typeof product?.department === 'string' && product.department.trim()
          ? product.department.trim()
          : null,
        discountPct: discountPct ?? 0,
        createdBy: req.user?.userId || null,
      };
    });

    if (errors.length > 0) {
      res.status(400).json({
        error: 'The import contains invalid product rows',
        errors,
      });
      return;
    }

    const result = await prisma.$transaction(async (transaction) => {
      return transaction.product.createMany({ data: validatedProducts });
    });

    res.status(201).json({
      message: `${result.count} products imported successfully`,
      importedCount: result.count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to import products', details: (error as Error).message });
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
