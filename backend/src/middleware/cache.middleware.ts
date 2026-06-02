import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../config/redis';
import logger from '../config/logger';

/**
 * Cache middleware — serves from Redis if available, else continues and caches response
 */
export const cacheResponse = (ttlSeconds: number, keyPrefix = '') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?._id?.toString() || 'anon';
    const cacheKey = `cache:${keyPrefix}:${userId}:${req.originalUrl}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-TTL', ttlSeconds.toString());
        res.status(200).json(JSON.parse(cached));
        return;
      }
    } catch {
      // Cache miss or error — continue normally
    }

    // Override res.json to intercept and cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        setCache(cacheKey, body, ttlSeconds).catch(() => {});
        res.setHeader('X-Cache', 'MISS');
      }
      return originalJson(body);
    };

    next();
  };
};
