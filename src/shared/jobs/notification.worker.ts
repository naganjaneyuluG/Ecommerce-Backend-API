import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/config/redis.config';
import Notification from '@modules/notifications/notification.model';
import { NotificationType } from '@shared/types/enums';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

const processNotificationJob = async (job: Job<CreateNotificationData>): Promise<void> => {
  const { userId, type, title, message, data } = job.data;

  await new Notification({
    user: userId,
    type,
    title,
    message,
    data,
  }).save();
};

export const startNotificationWorker = (): Worker => {
  const connection = getRedisClient();

  const worker = new Worker('notification', processNotificationJob, {
    connection,
    concurrency: 10,
  });

  worker.on('completed', (job) => {
    console.info(`Notification job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Notification job ${job?.id} failed:`, err.message);
  });

  console.info('Notification worker started');
  return worker;
};
