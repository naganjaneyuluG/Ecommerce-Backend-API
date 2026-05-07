import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { CouponRepository } from './coupon.repository';
import { ICoupon } from './coupon.model';
import { CreateCouponInput, UpdateCouponInput } from './coupon.dto';

export class CouponService {
  private couponRepository: CouponRepository;

  constructor() {
    this.couponRepository = new CouponRepository();
  }

  async createCoupon(data: CreateCouponInput): Promise<ICoupon> {
    const existing = await this.couponRepository.findByCode(data.code);
    if (existing) {
      throw new AppError('Coupon code already exists', StatusCodes.CONFLICT);
    }
    return this.couponRepository.create(data);
  }

  async listCoupons(page: number, limit: number): Promise<{ coupons: ICoupon[]; total: number; page: number; limit: number }> {
    const result = await this.couponRepository.findAll(page, limit);
    return { ...result, page, limit };
  }

  async validateCoupon(code: string): Promise<ICoupon> {
    const coupon = await this.couponRepository.findByCode(code);
    if (!coupon || !coupon.isActive) {
      throw new AppError('Invalid coupon code', StatusCodes.NOT_FOUND);
    }
    if (coupon.expiresAt < new Date()) {
      throw new AppError('Coupon has expired', StatusCodes.BAD_REQUEST);
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('Coupon usage limit reached', StatusCodes.BAD_REQUEST);
    }
    return coupon;
  }

  async updateCoupon(id: string, data: UpdateCouponInput): Promise<ICoupon> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', StatusCodes.NOT_FOUND);
    }
    const updated = await this.couponRepository.update(id, data);
    return updated!;
  }

  async deleteCoupon(id: string): Promise<void> {
    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', StatusCodes.NOT_FOUND);
    }
    await this.couponRepository.delete(id);
  }
}
