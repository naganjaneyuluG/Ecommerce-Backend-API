import http from 'http';
import createApp from './app';
import env from '@/config/env.config';
import { connectDB, disconnectDB } from '@/config/db.config';
import { connectRedis, disconnectRedis } from '@/config/redis.config';
import { initQueues, closeQueues } from '@shared/jobs/queues';
import { startEmailWorker } from '@shared/jobs/email.worker';
import { startOrderWorker } from '@shared/jobs/order.worker';
import { startNotificationWorker } from '@shared/jobs/notification.worker';
import { Worker } from 'bullmq';

let server: http.Server;
const workers: Worker[] = [];

const start = async (): Promise<void> => {
  // ─── Connect Infrastructure ─────────────────────────────────────────────
  await connectDB();
  await connectRedis();

  // ─── Initialize BullMQ Queues & Workers ─────────────────────────────────
  initQueues();
  workers.push(startEmailWorker());
  workers.push(startOrderWorker());
  workers.push(startNotificationWorker());

  // ─── Boot Express ───────────────────────────────────────────────────────
  const app = createApp();
  server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.info(`
🚀 Server running in ${env.NODE_ENV} mode
📍 URL:        http://localhost:${env.PORT}
📚 API Docs:   http://localhost:${env.PORT}/api/docs
❤️  Health:     http://localhost:${env.PORT}/health
    `);
  });
};

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = async (signal: string): Promise<void> => {
  console.info(`\n${signal} received — shutting down gracefully...`);

  // Stop accepting new connections
  server.close(async () => {
    try {
      // Close BullMQ workers
      await Promise.all(workers.map((w) => w.close()));
      await closeQueues();

      // Close DB & Redis connections
      await disconnectDB();
      await disconnectRedis();

      console.info('Graceful shutdown complete ✓');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force exit after 15 s
  setTimeout(() => {
    console.error('Forced exit after timeout');
    process.exit(1);
  }, 15000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
