import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { VendorService } from './vendor.service';

const vendorService = new VendorService();

export class VendorController {
  apply = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const vendor = await vendorService.applyForVendor(req.user!.userId, req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Vendor application submitted', data: { vendor } });
  });

  getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const vendor = await vendorService.getVendorProfile(req.user!.userId);
    sendSuccess({ res, message: 'Vendor profile retrieved', data: { vendor } });
  });

  updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const vendor = await vendorService.updateVendorProfile(req.user!.userId, req.body);
    sendSuccess({ res, message: 'Vendor profile updated', data: { vendor } });
  });

  getProducts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10' } = req.query;
    const result = await vendorService.getVendorProducts(req.user!.userId, Number(page), Number(limit));
    sendSuccess({
      res, message: 'Vendor products retrieved',
      data: { products: result.products },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  getAnalytics = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const analytics = await vendorService.getSalesAnalytics(req.user!.userId);
    sendSuccess({ res, message: 'Sales analytics retrieved', data: { analytics } });
  });

  listVendors = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', status } = req.query;
    const result = await vendorService.listVendors(Number(page), Number(limit), status as string);
    sendSuccess({
      res, message: 'Vendors listed',
      data: { vendors: result.vendors },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  approve = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const vendor = await vendorService.approveVendor(req.params['id'] as string);
    sendSuccess({ res, message: 'Vendor approved', data: { vendor } });
  });
}
