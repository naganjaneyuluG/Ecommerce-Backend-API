# Ecommerce Backend API

A **production-ready** ecommerce backend API built with Node.js, Express.js, and TypeScript — using clean architecture (service-repository pattern) and free-tier external services.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + Express.js + TypeScript (strict) |
| Database | MongoDB Atlas (free tier) via Mongoose |
| Cache / Queue | Upstash Redis + BullMQ |
| Storage | Cloudinary (free tier) |
| Email | Nodemailer via Resend SMTP / Gmail SMTP |
| Payments | Stripe (test) + Razorpay (test) |
| Docs | Swagger UI (`swagger-jsdoc` + `swagger-ui-express`) |
| Validation | Zod |
| Config | dotenv + envalid |

---

## Architecture

```
Client → Middleware Stack → Route Layer → Controllers → Services → Repositories → MongoDB
                                                    ↘ Redis Cache
                                                    ↘ BullMQ (email, order, notification queues)
                                                    ↘ Cloudinary / Stripe / Razorpay
```

**Layers:**
- **Config** — DB, Redis, Cloudinary, Stripe, Razorpay, Swagger, env validation
- **Shared** — middleware, utils, types, BullMQ jobs/workers
- **Modules** — 14 feature modules (auth, users, products, categories, cart, wishlist, orders, payments, inventory, reviews, coupons, notifications, admin, vendors)

---

## Project Structure

```
src/
├── config/          # env, db, redis, cloudinary, stripe, razorpay, swagger
├── modules/         # 14 feature modules (each: model, dto, repo, service, controller, routes)
├── shared/
│   ├── jobs/        # BullMQ queues + email/order/notification workers
│   ├── middlewares/ # auth, rbac, validate, error-handler, rate-limiter, audit-logger, upload
│   ├── types/       # enums, interfaces, express.d.ts augmentation
│   └── utils/       # response, async-wrapper, token, pagination, email, hash, slug
├── app.ts           # Express app factory
└── server.ts        # Entry point + graceful shutdown
```

---

## Setup

### Prerequisites
- Node.js ≥ 20
- A MongoDB Atlas cluster (free tier)
- An Upstash Redis instance (free tier)
- Cloudinary account (free tier)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ecommerce-backend-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in all values in .env
```

See [Environment Variables](#environment-variables) for details.

### 3. Run in Development

```bash
npm run dev
```

Server starts at `http://localhost:5000`

### 4. Other Commands

```bash
npm run build       # Compile TypeScript → dist/
npm start           # Run compiled dist/server.js
npm run typecheck   # Type check without emitting
npm run lint        # ESLint check
npm run lint:fix    # ESLint auto-fix
npm test            # Run Jest tests
npm run test:coverage  # With coverage report
```

---

## API Documentation

Once running, visit:

```
http://localhost:5000/api/docs
```

Swagger UI lists all endpoints with request/response schemas and Bearer token auth.

---

## API Reference

**Base URL:** `/api/v1`

| Module | Endpoints | Auth |
|---|---|---|
| Auth | POST /auth/register, /auth/login, /auth/logout, /auth/refresh, /auth/verify-email/:token, /auth/forgot-password, /auth/reset-password/:token | Public / Token |
| Users | GET/PUT /users/me, PUT /users/me/avatar, CRUD /users/me/addresses, GET /users (admin) | JWT |
| Products | CRUD /products, POST /products/:id/images | Public / Vendor / Admin |
| Categories | CRUD /categories | Public / Admin |
| Cart | GET/POST/PUT/DELETE /cart, /cart/items, /cart/coupon | JWT |
| Wishlist | GET/POST/DELETE /wishlist/:productId, POST /wishlist/:productId/move-to-cart | JWT |
| Orders | POST /orders, GET /orders, GET /orders/:id, PUT /orders/:id/cancel, PUT /orders/:id/status | JWT |
| Payments | POST /payments/stripe/checkout, /payments/razorpay/order, webhook handlers | JWT |
| Inventory | GET/PUT /inventory/:productId, GET /inventory/low-stock | Vendor / Admin |
| Reviews | CRUD /reviews/:productId | JWT (verified purchase) |
| Coupons | CRUD /coupons, GET /coupons/:code | Admin / Public |
| Notifications | GET /notifications, PUT read/read-all, DELETE | JWT |
| Admin | Dashboard, analytics, user/order management | Admin |
| Vendors | Apply, profile, products, analytics, admin approval | Vendor / Admin |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `CLIENT_URL` | Frontend URL for CORS |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ≥32 character secret for access tokens |
| `JWT_REFRESH_SECRET` | ≥32 character secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry (e.g. `7d`) |
| `REDIS_URL` | Upstash Redis URL (`rediss://...`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID (`rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `SMTP_HOST` | SMTP host (e.g. `smtp.resend.com`) |
| `SMTP_PORT` | SMTP port (e.g. `465`) |
| `SMTP_USER` | SMTP user |
| `SMTP_PASS` | SMTP password / API key |
| `SMTP_FROM` | Sender name + email |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default: 100) |

---

## Docker

### Development (local MongoDB + Redis)

```bash
docker-compose up -d
```

API: `http://localhost:5000` | Mongo Express (dev-tools): `http://localhost:8081`

```bash
# Include dev tools (Mongo Express)
docker-compose --profile dev-tools up -d
```

### Production build

```bash
docker build -t ecommerce-api --target production .
docker run -p 5000:5000 --env-file .env ecommerce-api
```

---

## Background Jobs (BullMQ)

Three queues backed by Upstash Redis:

| Queue | Worker | Jobs |
|---|---|---|
| `email` | email.worker | welcome, verify-email, password-reset, low-stock-alert |
| `order` | order.worker | inventory deduction, order confirmation email, notifications |
| `notification` | notification.worker | persist in-app notifications to DB |

All queues: **3 retry attempts** with exponential backoff, dead-letter count tracking.

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **Lint & Type Check** — ESLint + `tsc --noEmit`
2. **Tests** — Jest with MongoDB + Redis service containers
3. **Build** — TypeScript compilation
4. **Docker** — Build & push to GHCR (main branch only)
5. **Security** — `npm audit` + Trivy vulnerability scan

---

## Health Check

```
GET /health
```

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-05-07T...",
  "uptime": 42.3,
  "environment": "development"
}
```

---

## Security Features

- **Helmet** — HTTP security headers
- **CORS** — Configured origin whitelist
- **Rate Limiting** — Global (100 req/15 min) + strict auth limiter (10 req/15 min)
- **JWT** — HTTP-only cookies + Authorization header, refresh token rotation with reuse detection
- **RBAC** — Role-based access: `admin`, `vendor`, `customer`
- **Audit Logging** — All mutating requests (POST/PUT/PATCH/DELETE) logged to MongoDB
- **Zod Validation** — All request bodies, queries, and params validated
- **Non-root Docker user** — Production container runs as `nodejs` (uid 1001)

---

## License

ISC