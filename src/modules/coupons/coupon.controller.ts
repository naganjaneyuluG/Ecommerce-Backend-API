import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { CouponService } from './coupon.service';

const couponService = new CouponService();

export class CouponController {
  create = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const coupon = await couponService.createCoupon(req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Coupon created', data: { coupon } });
  });

  list = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10' } = req.query;
    const result = await couponService.listCoupons(Number(page), Number(limit));
    sendSuccess({
      res, message: 'Coupons retrieved',
      data: { coupons: result.coupons },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  validate = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const coupon = await couponService.validateCoupon(req.params['code'] as string);
    sendSuccess({ res, message: 'Coupon is valid', data: { coupon } });
  });

  update = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const coupon = await couponService.updateCoupon(req.params['id'] as string, req.body);
    sendSuccess({ res, message: 'Coupon updated', data: { coupon } });
  });

  delete = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await couponService.deleteCoupon(req.params['id'] as string);
    sendSuccess({ res, message: 'Coupon deleted' });
  });
}
