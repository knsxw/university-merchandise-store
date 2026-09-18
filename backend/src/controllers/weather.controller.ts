import { Request, Response } from 'express';
import prisma from '../config/db';
import { fetchCampusWeatherRecommendation } from '../services/weather.service';

export const getWeatherRecommendations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const weather = await fetchCampusWeatherRecommendation();
    const availableProducts = await prisma.product.findMany({
      where: { stock: { gt: 0 } },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        department: true,
        discountPct: true,
        categoryId: true,
      },
      orderBy: { id: 'asc' },
    });

    const matchingProducts = availableProducts.filter((product) => {
      const searchableName = product.name.toLowerCase();
      return weather.recommendation.productKeywords.some((keyword) => searchableName.includes(keyword));
    });
    const selectedProducts = (matchingProducts.length > 0 ? matchingProducts : availableProducts).slice(0, 3);

    res.json({
      ...weather,
      recommendation: {
        message: weather.recommendation.message,
        products: selectedProducts.map((product) => ({
          ...product,
          price: Number(product.price),
          discountPct: product.discountPct ? Number(product.discountPct) : null,
        })),
      },
    });
  } catch (error) {
    res.status(503).json({
      error: 'Weather recommendations are temporarily unavailable',
      details: (error as Error).message,
    });
  }
};
