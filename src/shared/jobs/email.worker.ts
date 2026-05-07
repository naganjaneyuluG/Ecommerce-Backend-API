import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@/config/redis.config';
import { sendEmail, emailTemplates } from '@shared/utils/email.util';
import User from '@modules/users/user.model';
import Order from '@modules/orders/order.model';

interface WelcomeEmailData {
  userId: string;
}

interface OrderConfirmationData {
  orderId: string;
  userId: string;
}

interface PasswordResetData {
  email: string;
  name: string;
  resetLink: string;
}

interface LowStockAlertData {
  productId: string;
  productName: string;
  currentStock: number;
}

interface OrderCancelledData {
  userId: string;
  orderId: string;
}

type EmailJobData = WelcomeEmailData | OrderConfirmationData | PasswordResetData | LowStockAlertData | OrderCancelledData;

const processEmailJob = async (job: Job<EmailJobData>): Promise<void> => {
  const { name, data } = job;

  switch (name) {
    case 'welcome': {
      const { userId } = data as WelcomeEmailData;
      const user = await User.findById(userId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: 'Welcome to Ecommerce Store!',
          html: emailTemplates.welcome(user.name),
        });
      }
      break;
    }

    case 'order-confirmation': {
      const { orderId, userId } = data as OrderConfirmationData;
      const [user, order] = await Promise.all([
        User.findById(userId),
        Order.findById(orderId),
      ]);
      if (user && order) {
        await sendEmail({
          to: user.email,
          subject: `Order Confirmed - #${order.orderNumber}`,
          html: emailTemplates.orderConfirmation(user.name, order.orderNumber, order.totalAmount),
        });
      }
      break;
    }

    case 'password-reset': {
      const { email, name: userName, resetLink } = data as PasswordResetData;
      await sendEmail({
        to: email,
        subject: 'Reset Your Password - Ecommerce Store',
        html: emailTemplates.resetPassword(userName, resetLink),
      });
      break;
    }

    case 'low-stock-alert': {
      const { productName, currentStock } = data as LowStockAlertData;
      // Send to all admins
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `⚠️ Low Stock Alert - ${productName}`,
          html: emailTemplates.lowStockAlert(productName, currentStock),
        });
      }
      break;
    }

    case 'order-cancelled': {
      const { userId: cancelUserId, orderId: cancelOrderId } = data as OrderCancelledData;
      const user = await User.findById(cancelUserId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Order Cancelled - #${cancelOrderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #E53E3E;">Order Cancelled</h2>
              <p>Hi ${user.name},</p>
              <p>Your order <strong>#${cancelOrderId}</strong> has been cancelled.</p>
              <p>If you did not request this cancellation, please contact our support team.</p>
            </div>
          `,
        });
      }
      break;
    }

    default:
      console.warn(`Unknown email job type: ${name}`);
  }
};

export const startEmailWorker = (): Worker => {
  const connection = getRedisClient();

  const worker = new Worker('email', processEmailJob, {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });

  worker.on('completed', (job) => {
    console.info(`Email job ${job.id} (${job.name}) completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  console.info('Email worker started');
  return worker;
};
