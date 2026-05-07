import { Queue } from 'bullmq';
import { getRedisClient } from '@/config/redis.config';

let emailQueue: Queue | null = null;
let orderQueue: Queue | null = null;
let notificationQueue: Queue | null = null;

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: {
    count: 100,
    age: 24 * 60 * 60, // 24 hours
  },
  removeOnFail: {
    count: 500,
  },
};

export const initQueues = (): void => {
  const connection = getRedisClient();

  emailQueue = new Queue('email', {
    connection,
    defaultJobOptions,
  });

  orderQueue = new Queue('order', {
    connection,
    defaultJobOptions,
  });

  notificationQueue = new Queue('notification', {
    connection,
    defaultJobOptions,
  });

  console.info('BullMQ queues initialized: email, order, notification');
};

export const getEmailQueue = (): Queue | null => emailQueue;
export const getOrderQueue = (): Queue | null => orderQueue;
export const getNotificationQueue = (): Queue | null => notificationQueue;

export const closeQueues = async (): Promise<void> => {
  const queues = [emailQueue, orderQueue, notificationQueue].filter(Boolean);
  await Promise.all(queues.map((q) => q!.close()));
  emailQueue = null;
  orderQueue = null;
  notificationQueue = null;
  console.info('BullMQ queues closed');
};
