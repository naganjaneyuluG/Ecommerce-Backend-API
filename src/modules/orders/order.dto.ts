import { z } from 'zod';

export const placeOrderDto = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(2).max(100).trim(),
    phone: z.string().min(10).max(15).trim(),
    addressLine1: z.string().min(5).max(200).trim(),
    addressLine2: z.string().max(200).trim().optional(),
    city: z.string().min(2).max(100).trim(),
    state: z.string().min(2).max(100).trim(),
    postalCode: z.string().min(3).max(20).trim(),
    country: z.string().min(2).max(100).trim(),
  }),
  paymentProvider: z.enum(['stripe', 'razorpay']),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusDto = z.object({
  status: z.enum(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export const cancelOrderDto = z.object({
  reason: z.string().min(5).max(500).trim().optional(),
});

export const orderIdParamsDto = z.object({
  id: z.string().min(1),
});

export const listOrdersQueryDto = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().positive().optional()),
  limit: z.string().optional().transform(Number).pipe(z.number().positive().max(100).optional()),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderDto>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusDto>;
