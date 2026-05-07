import { z } from 'zod';

export const updateInventoryDto = z.object({
  quantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  variant: z.string().optional(),
});

export const inventoryProductParamsDto = z.object({
  productId: z.string().min(1),
});

export type UpdateInventoryInput = z.infer<typeof updateInventoryDto>;
