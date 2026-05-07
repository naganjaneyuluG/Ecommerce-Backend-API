import Vendor, { IVendor } from './vendor.model';
import { FilterQuery } from 'mongoose';

export class VendorRepository {
  async create(data: Partial<IVendor>): Promise<IVendor> {
    return new Vendor(data).save();
  }

  async findByUser(userId: string): Promise<IVendor | null> {
    return Vendor.findOne({ user: userId }).populate('user', 'name email').exec();
  }

  async findById(id: string): Promise<IVendor | null> {
    return Vendor.findById(id).populate('user', 'name email').exec();
  }

  async findAll(
    page: number,
    limit: number,
    filters: FilterQuery<IVendor> = {}
  ): Promise<{ vendors: IVendor[]; total: number }> {
    const skip = (page - 1) * limit;
    const [vendors, total] = await Promise.all([
      Vendor.find(filters).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Vendor.countDocuments(filters),
    ]);
    return { vendors, total };
  }

  async update(id: string, data: Partial<IVendor>): Promise<IVendor | null> {
    return Vendor.findByIdAndUpdate(id, data, { new: true }).populate('user', 'name email').exec();
  }

  async updateByUser(userId: string, data: Partial<IVendor>): Promise<IVendor | null> {
    return Vendor.findOneAndUpdate({ user: userId }, data, { new: true }).populate('user', 'name email').exec();
  }
}
