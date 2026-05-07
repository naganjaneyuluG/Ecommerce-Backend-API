import { z } from 'zod';

export const createReviewDto = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).trim().optional(),
  comment: z.string().min(5).max(2000).trim(),
});

export const updateReviewDto = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).trim().optional(),
  comment: z.string().min(5).max(2000).trim().optional(),
});

export const reviewProductParamsDto = z.object({
  productId: z.string().min(1),
});

export const reviewIdParamsDto = z.object({
  id: z.string().min(1),
});

export const listReviewsQueryDto = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().positive().optional()),
  limit: z.string().optional().transform(Number).pipe(z.number().positive().max(100).optional()),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewDto>;
export type UpdateReviewInput = z.infer<typeof updateReviewDto>;
