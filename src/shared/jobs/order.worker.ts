import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/config/redis.config';
import { getEmailQueue, getNotificationQueue } from './queues';
import Order from '@modules/orders/order.model';
import Inventory from '@modules/inventory/inventory.model';
import { NotificationType } from '@shared/types/enums';

interface ProcessOrderData {
  orderId: string;
  userId: string;
  paymentProvider: string;
}

const processOrderJob = async (job: Job<ProcessOrderData>): Promise<void> => {
  const { orderId, userId } = job.data;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Check inventory levels after reservation
  for (const item of order.items) {
    const inventory = await Inventory.findOne({ product: item.product });
    if (inventory && inventory.quantity <= inventory.lowStockThreshold) {
      // Dispatch low-stock email alert
      const emailQueue = getEmailQueue();
      if (emailQueue) {
        await emailQueue.add('low-stock-alert', {
          productId: item.product.toString(),
          productName: item.productName,
          currentStock: inventory.quantity,
        });
      }
    }
  }

  // Create in-app notification for the user
  const notificationQueue = getNotificationQueue();
  if (notificationQueue) {
    await notificationQueue.add('create-notification', {
      userId,
      type: NotificationType.ORDER_PLACED,
      title: 'Order Placed Successfully',
      message: `Your order #${order.orderNumber} has been placed and is being processed.`,
      data: { orderId, orderNumber: order.orderNumber },
    });
  }

  // Send order confirmation email
  const emailQueue = getEmailQueue();
  if (emailQueue) {
    await emailQueue.add('order-confirmation', {
      orderId,
      userId,
    });
  }
};

export const startOrderWorker = (): Worker => {
  const connection = getRedisClient();

  const worker = new Worker('order', processOrderJob, {
    connection,
    concurrency: 3,
  });

  worker.on('completed', (job) => {
    console.info(`Order job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Order job ${job?.id} failed:`, err.message);
  });

  console.info('Order worker started');
  return worker;
};
