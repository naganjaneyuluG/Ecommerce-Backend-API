import { z } from 'zod';

export const addToCartDto = z.object({
  product: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive().max(50).default(1),
});

export const updateCartItemDto = z.object({
  quantity: z.number().int().positive().max(50),
});

export const cartProductParamsDto = z.object({
  productId: z.string().min(1),
});

export const applyCouponDto = z.object({
  code: z.string().min(1, 'Coupon code is required').trim().toUpperCase(),
});

export type AddToCartInput = z.infer<typeof addToCartDto>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemDto>;
