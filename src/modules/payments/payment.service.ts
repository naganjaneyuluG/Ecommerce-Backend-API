import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import stripe from '@/config/stripe.config';
import razorpay from '@/config/razorpay.config';
import env from '@/config/env.config';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { PaymentStatus, PaymentProvider, OrderStatus } from '@shared/types/enums';
import { PaymentRepository } from './payment.repository';
import { IPayment } from './payment.model';
import Order from '@modules/orders/order.model';
import { getEmailQueue } from '@shared/jobs/queues';

export class PaymentService {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }

  async createStripeCheckout(orderId: string, userId: string): Promise<{ sessionId: string; url: string }> {
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }
    if (order.user.toString() !== userId) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }
    if (order.payment) {
      throw new AppError('Order already has a payment', StatusCodes.CONFLICT);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: order.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productName,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
      success_url: `${env.CLIENT_URL}/orders/${order._id}?payment=success`,
      cancel_url: `${env.CLIENT_URL}/orders/${order._id}?payment=cancelled`,
    });

    // Create payment record
    const payment = await this.paymentRepository.create({
      order: order._id,
      user: userId as unknown as IPayment['user'],
      provider: PaymentProvider.STRIPE,
      providerPaymentId: session.id,
      amount: order.totalAmount,
      currency: 'usd',
      status: PaymentStatus.PENDING,
    });

    // Link payment to order
    order.payment = payment._id;
    await order.save();

    return { sessionId: session.id, url: session.url ?? '' };
  }

  async createRazorpayOrder(orderId: string, userId: string): Promise<{ razorpayOrderId: string; amount: number; currency: string }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }
    if (order.user.toString() !== userId) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }
    if (order.payment) {
      throw new AppError('Order already has a payment', StatusCodes.CONFLICT);
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId,
      },
    });

    // Create payment record
    const payment = await this.paymentRepository.create({
      order: order._id,
      user: userId as unknown as IPayment['user'],
      provider: PaymentProvider.RAZORPAY,
      providerPaymentId: razorpayOrder.id,
      providerOrderId: razorpayOrder.id,
      amount: order.totalAmount,
      currency: 'inr',
      status: PaymentStatus.PENDING,
    });

    order.payment = payment._id;
    await order.save();

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount as number,
      currency: razorpayOrder.currency,
    };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new AppError('Invalid webhook signature', StatusCodes.BAD_REQUEST);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const payment = await this.paymentRepository.findByProviderPaymentId(session.id);
      if (payment) {
        payment.status = PaymentStatus.COMPLETED;
        payment.paidAt = new Date();
        await payment.save();

        await Order.findByIdAndUpdate(payment.order, { status: OrderStatus.CONFIRMED });

        // Send confirmation email
        const emailQueue = getEmailQueue();
        if (emailQueue) {
          await emailQueue.add('order-confirmation', {
            orderId: payment.order.toString(),
            userId: payment.user.toString(),
          });
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const payment = await this.paymentRepository.findByProviderPaymentId(session.id);
      if (payment) {
        payment.status = PaymentStatus.FAILED;
        await payment.save();
      }
    }
  }

  async handleRazorpayWebhook(body: Record<string, unknown>, signature: string): Promise<void> {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new AppError('Invalid webhook signature', StatusCodes.BAD_REQUEST);
    }

    const event = body.event as string;
    const payload = body.payload as Record<string, Record<string, Record<string, unknown>>>;

    if (event === 'payment.captured') {
      const razorpayPayment = payload.payment?.entity;
      if (razorpayPayment) {
        const orderId = razorpayPayment.order_id as string;
        const payment = await this.paymentRepository.findByProviderOrderId(orderId);
        if (payment) {
          payment.status = PaymentStatus.COMPLETED;
          payment.providerPaymentId = razorpayPayment.id as string;
          payment.paidAt = new Date();
          await payment.save();

          await Order.findByIdAndUpdate(payment.order, { status: OrderStatus.CONFIRMED });
        }
      }
    }

    if (event === 'payment.failed') {
      const razorpayPayment = payload.payment?.entity;
      if (razorpayPayment) {
        const orderId = razorpayPayment.order_id as string;
        const payment = await this.paymentRepository.findByProviderOrderId(orderId);
        if (payment) {
          payment.status = PaymentStatus.FAILED;
          await payment.save();
        }
      }
    }
  }

  async getPaymentByOrder(orderId: string, userId: string): Promise<IPayment> {
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== userId) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }

    const payment = await this.paymentRepository.findByOrder(orderId);
    if (!payment) {
      throw new AppError('Payment not found', StatusCodes.NOT_FOUND);
    }

    return payment;
  }
}
