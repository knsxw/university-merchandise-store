import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Middleware for authenticating partner system requests via x-api-key header
 */
export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized: Missing x-api-key header',
      message: 'This endpoint requires partner API key authentication.',
    });
    return;
  }

  if (apiKey !== config.partnerExposedApiKey) {
    res.status(403).json({
      error: 'Forbidden: Invalid API key',
      message: 'The provided x-api-key is invalid or unauthorized.',
    });
    return;
  }

  next();
};
