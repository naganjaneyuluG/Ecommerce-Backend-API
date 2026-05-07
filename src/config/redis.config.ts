import IORedis, { Redis } from 'ioredis';
import env from './env.config';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<void> => {
  redisClient = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: true,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  return new Promise((resolve, reject) => {
    redisClient!.on('connect', () => {
      console.info('Redis client connected');
    });

    redisClient!.on('ready', () => {
      console.info('Redis client ready');
      resolve();
    });

    redisClient!.on('error', (err) => {
      console.error('Redis client error:', err.message);
    });

    redisClient!.on('close', () => {
      console.warn('Redis connection closed');
    });

    redisClient!.on('reconnecting', () => {
      console.info('Redis reconnecting...');
    });

    // Reject if not ready within 10s
    setTimeout(() => {
      if (redisClient?.status !== 'ready') {
        reject(new Error('Redis connection timeout'));
      }
    }, 10000);
  });
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.info('Redis disconnected');
  }
};
