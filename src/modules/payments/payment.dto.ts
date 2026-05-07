import { z } from 'zod';

export const stripeCheckoutDto = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const razorpayOrderDto = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export const paymentOrderParamsDto = z.object({
  orderId: z.string().min(1),
});

export type StripeCheckoutInput = z.infer<typeof stripeCheckoutDto>;
export type RazorpayOrderInput = z.infer<typeof razorpayOrderDto>;
