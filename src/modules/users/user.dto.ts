import { z } from 'zod';

export const updateProfileDto = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().min(10).max(15).optional(),
});

export const addAddressDto = z.object({
  fullName: z.string().min(2).max(100).trim(),
  phone: z.string().min(10).max(15).trim(),
  addressLine1: z.string().min(5).max(200).trim(),
  addressLine2: z.string().max(200).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().min(2).max(100).trim(),
  postalCode: z.string().min(3).max(20).trim(),
  country: z.string().min(2).max(100).trim(),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressDto = addAddressDto.partial();

export const userIdParamsDto = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const addressIdParamsDto = z.object({
  addressId: z.string().min(1, 'Address ID is required'),
});

export const listUsersQueryDto = z.object({
  page: z.string().optional().transform(Number).pipe(z.number().positive().optional()),
  limit: z.string().optional().transform(Number).pipe(z.number().positive().max(100).optional()),
  role: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileDto>;
export type AddAddressInput = z.infer<typeof addAddressDto>;
export type UpdateAddressInput = z.infer<typeof updateAddressDto>;
