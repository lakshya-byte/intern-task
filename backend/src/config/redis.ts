import Redis from 'ioredis';
import logger from './logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryStrategy(times) {
        const delay = Math.min(times * 500, 2000);
        logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }
  return redisClient;
};

export const getCache = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (err) {
    logger.warn('Redis getCache error', { key, error: err });
    return null;
  }
};

export const setCache = async (key: string, data: unknown, ttlSeconds: number): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    logger.warn('Redis setCache error', { key, error: err });
  }
};

export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
      logger.debug('Cache invalidated', { pattern, count: keys.length });
    }
  } catch (err) {
    logger.warn('Redis invalidateCache error', { pattern, error: err });
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
};

export default getRedisClient;
