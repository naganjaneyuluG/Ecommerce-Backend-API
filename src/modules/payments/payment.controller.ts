import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { PaymentService } from './payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  createStripeCheckout = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.createStripeCheckout(req.body.orderId, req.user!.userId);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Stripe checkout session created', data: result });
  });

  createRazorpayOrder = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.createRazorpayOrder(req.body.orderId, req.user!.userId);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Razorpay order created', data: result });
  });

  stripeWebhook = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string;
    await paymentService.handleStripeWebhook(req.body as Buffer, signature);
    sendSuccess({ res, message: 'Webhook processed' });
  });

  razorpayWebhook = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['x-razorpay-signature'] as string;
    await paymentService.handleRazorpayWebhook(req.body as Record<string, unknown>, signature);
    sendSuccess({ res, message: 'Webhook processed' });
  });

  getPaymentStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const payment = await paymentService.getPaymentByOrder(req.params['orderId'] as string, req.user!.userId);
    sendSuccess({ res, message: 'Payment status retrieved', data: { payment } });
  });
}
