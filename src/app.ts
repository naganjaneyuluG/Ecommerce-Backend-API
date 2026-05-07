import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { StatusCodes } from 'http-status-codes';

import env from '@/config/env.config';
import swaggerSpec from '@/config/swagger.config';
import { globalRateLimiter } from '@shared/middlewares/rate-limiter.middleware';
import { errorHandler } from '@shared/middlewares/error-handler.middleware';
import { auditLogger } from '@shared/middlewares/audit-logger.middleware';

// Route imports
import authRoutes from '@modules/auth/auth.routes';
import userRoutes from '@modules/users/user.routes';
import productRoutes from '@modules/products/product.routes';
import categoryRoutes from '@modules/categories/category.routes';
import cartRoutes from '@modules/cart/cart.routes';
import wishlistRoutes from '@modules/wishlist/wishlist.routes';
import orderRoutes from '@modules/orders/order.routes';
import paymentRoutes from '@modules/payments/payment.routes';
import inventoryRoutes from '@modules/inventory/inventory.routes';
import reviewRoutes from '@modules/reviews/review.routes';
import couponRoutes from '@modules/coupons/coupon.routes';
import notificationRoutes from '@modules/notifications/notification.routes';
import adminRoutes from '@modules/admin/admin.routes';
import vendorRoutes from '@modules/vendors/vendor.routes';

const createApp = (): Application => {
  const app = express();

  // ─── Security Middleware ────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ─── Trust proxy (for reverse proxy setups) ─────────────────────────────
  app.set('trust proxy', 1);

  // ─── Request Parsing ────────────────────────────────────────────────────
  // NOTE: Stripe webhook MUST use raw body — handled at route level with express.raw()
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/v1/payments/stripe/webhook') {
      next();
    } else {
      express.json({ limit: '10mb' })(req, res, next);
    }
  });
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Logging ────────────────────────────────────────────────────────────
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ─── Rate Limiting ──────────────────────────────────────────────────────
  app.use('/api/', globalRateLimiter);

  // ─── Health Check ───────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  });

  // ─── API Documentation ──────────────────────────────────────────────────
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Ecommerce API Docs',
    })
  );

  // ─── API Routes ─────────────────────────────────────────────────────────
  const API_PREFIX = '/api/v1';

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/products`, productRoutes);
  app.use(`${API_PREFIX}/categories`, categoryRoutes);
  app.use(`${API_PREFIX}/cart`, cartRoutes);
  app.use(`${API_PREFIX}/wishlist`, wishlistRoutes);
  app.use(`${API_PREFIX}/orders`, auditLogger, orderRoutes);
  app.use(`${API_PREFIX}/payments`, paymentRoutes);
  app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
  app.use(`${API_PREFIX}/reviews`, reviewRoutes);
  app.use(`${API_PREFIX}/coupons`, couponRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/admin`, adminRoutes);
  app.use(`${API_PREFIX}/vendors`, vendorRoutes);

  // ─── 404 Handler ────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Route not found',
    });
  });

  // ─── Global Error Handler ───────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

export default createApp;
