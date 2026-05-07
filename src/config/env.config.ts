import { cleanEnv, str, port, num } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

const env = cleanEnv(process.env, {
  // Server
  PORT: port({ default: 5000 }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  CLIENT_URL: str({ default: 'http://localhost:3000' }),
  ALLOWED_ORIGINS: str({ default: 'http://localhost:3000' }),

  // MongoDB
  MONGO_URI: str(),

  // JWT
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRY: str({ default: '15m' }),
  JWT_REFRESH_EXPIRY: str({ default: '7d' }),

  // Redis
  REDIS_URL: str(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),

  // Stripe
  STRIPE_SECRET_KEY: str(),
  STRIPE_WEBHOOK_SECRET: str(),

  // Razorpay
  RAZORPAY_KEY_ID: str(),
  RAZORPAY_KEY_SECRET: str(),

  // Email / SMTP
  SMTP_HOST: str(),
  SMTP_PORT: port({ default: 465 }),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str({ default: '"Ecommerce Store" <noreply@ecommerce.com>' }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),
});

export default env;
