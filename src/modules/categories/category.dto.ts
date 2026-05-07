import { z } from 'zod';

export const createCategoryDto = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  parent: z.string().nullable().optional(),
});

export const updateCategoryDto = createCategoryDto.partial();

export const categorySlugParamsDto = z.object({
  slug: z.string().min(1),
});

export const categoryIdParamsDto = z.object({
  id: z.string().min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategoryDto>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryDto>;
