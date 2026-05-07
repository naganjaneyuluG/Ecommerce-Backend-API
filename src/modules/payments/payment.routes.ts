import { Router, raw } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { stripeCheckoutDto, razorpayOrderDto, paymentOrderParamsDto } from './payment.dto';

const router = Router();
const paymentController = new PaymentController();

/**
 * @swagger
 * /payments/stripe/checkout:
 *   post:
 *     tags: [Payments]
 *     summary: Create Stripe Checkout Session
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Checkout session created
 */
router.post('/stripe/checkout', authenticate, validate({ body: stripeCheckoutDto }), paymentController.createStripeCheckout);

/**
 * @swagger
 * /payments/razorpay/order:
 *   post:
 *     tags: [Payments]
 *     summary: Create Razorpay Order
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Razorpay order created
 */
router.post('/razorpay/order', authenticate, validate({ body: razorpayOrderDto }), paymentController.createRazorpayOrder);

/**
 * @swagger
 * /payments/stripe/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Stripe webhook handler
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/stripe/webhook', raw({ type: 'application/json' }), paymentController.stripeWebhook);

/**
 * @swagger
 * /payments/razorpay/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Razorpay webhook handler
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/razorpay/webhook', paymentController.razorpayWebhook);

/**
 * @swagger
 * /payments/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment status
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get('/:orderId', authenticate, validate({ params: paymentOrderParamsDto }), paymentController.getPaymentStatus);

export default router;
