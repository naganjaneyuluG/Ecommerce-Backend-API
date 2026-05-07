import { z } from 'zod';

export const createProductDto = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
  shortDescription: z.string().max(500).trim().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string().trim()).optional().default([]),
  sku: z.string().min(1).max(100).trim(),
  weight: z.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).trim(),
        sku: z.string().min(1).trim(),
        price: z.number().positive(),
        compareAtPrice: z.number().positive().optional(),
        attributes: z.record(z.string()).optional().default({}),
      })
    )
    .optional()
    .default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const updateProductDto = createProductDto.partial();

export const listProductsQueryDto = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().positive().optional()),
  limit: z.string().optional().transform(Number).pipe(z.number().positive().max(100).optional()),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform(Number).pipe(z.number().nonnegative().optional()),
  maxPrice: z.string().optional().transform(Number).pipe(z.number().positive().optional()),
  minRating: z.string().optional().transform(Number).pipe(z.number().min(0).max(5).optional()),
  vendor: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  isFeatured: z.string().optional(),
  sortBy: z.enum(['price', 'avgRating', 'createdAt', 'name', 'totalReviews']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  cursor: z.string().optional(),
});

export const productSlugParamsDto = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const productIdParamsDto = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

export type CreateProductInput = z.infer<typeof createProductDto>;
export type UpdateProductInput = z.infer<typeof updateProductDto>;
