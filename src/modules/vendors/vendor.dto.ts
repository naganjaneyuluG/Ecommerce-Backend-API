import { z } from 'zod';

export const vendorApplyDto = z.object({
  businessName: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  phone: z.string().min(10).max(15).trim().optional(),
  address: z
    .object({
      addressLine1: z.string().min(5).max(200).trim(),
      addressLine2: z.string().max(200).trim().optional(),
      city: z.string().min(2).max(100).trim(),
      state: z.string().min(2).max(100).trim(),
      postalCode: z.string().min(3).max(20).trim(),
      country: z.string().min(2).max(100).trim(),
    })
    .optional(),
});

export const updateVendorDto = vendorApplyDto.partial();

export const vendorIdParamsDto = z.object({
  id: z.string().min(1),
});

export type VendorApplyInput = z.infer<typeof vendorApplyDto>;
export type UpdateVendorInput = z.infer<typeof updateVendorDto>;
