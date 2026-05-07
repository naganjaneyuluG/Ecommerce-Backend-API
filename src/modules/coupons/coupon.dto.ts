import { z } from 'zod';

export const createCouponDto = z.object({
  code: z.string().min(3).max(30).trim().toUpperCase(),
  type: z.enum(['percentage', 'flat']),
  value: z.number().positive(),
  description: z.string().max(500).trim().optional(),
  minOrderAmount: z.number().nonnegative().optional().default(0),
  maxDiscountAmount: z.number().positive().optional(),
  maxUses: z.number().int().nonnegative().optional().default(0),
  perUserLimit: z.number().int().positive().optional().default(1),
  expiresAt: z.string().datetime().transform((val) => new Date(val)),
});

export const updateCouponDto = createCouponDto.partial();

export const couponCodeParamsDto = z.object({
  code: z.string().min(1),
});

export const couponIdParamsDto = z.object({
  id: z.string().min(1),
});

export type CreateCouponInput = z.infer<typeof createCouponDto>;
export type UpdateCouponInput = z.infer<typeof updateCouponDto>;
