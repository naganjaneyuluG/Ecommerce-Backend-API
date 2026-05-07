import Coupon, { ICoupon } from './coupon.model';
import { FilterQuery } from 'mongoose';

export class CouponRepository {
  async create(data: Partial<ICoupon>): Promise<ICoupon> {
    return new Coupon(data).save();
  }

  async findById(id: string): Promise<ICoupon | null> {
    return Coupon.findById(id).exec();
  }

  async findByCode(code: string): Promise<ICoupon | null> {
    return Coupon.findOne({ code: code.toUpperCase() }).exec();
  }

  async findAll(page: number, limit: number, filters: FilterQuery<ICoupon> = {}): Promise<{ coupons: ICoupon[]; total: number }> {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      Coupon.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Coupon.countDocuments(filters),
    ]);
    return { coupons, total };
  }

  async update(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
    return Coupon.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await Coupon.findByIdAndDelete(id).exec();
  }
}
