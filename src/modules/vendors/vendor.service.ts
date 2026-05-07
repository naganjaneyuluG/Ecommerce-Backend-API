import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { VendorStatus, Role } from '@shared/types/enums';
import { generateCleanSlug } from '@shared/utils/slug.util';
import { VendorRepository } from './vendor.repository';
import { IVendor } from './vendor.model';
import { VendorApplyInput, UpdateVendorInput } from './vendor.dto';
import User from '@modules/users/user.model';
import { ProductRepository } from '@modules/products/product.repository';
import { OrderRepository } from '@modules/orders/order.repository';

export class VendorService {
  private vendorRepository: VendorRepository;
  private productRepository: ProductRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.vendorRepository = new VendorRepository();
    this.productRepository = new ProductRepository();
    this.orderRepository = new OrderRepository();
  }

  async applyForVendor(userId: string, data: VendorApplyInput): Promise<IVendor> {
    const existing = await this.vendorRepository.findByUser(userId);
    if (existing) {
      throw new AppError('You have already applied as a vendor', StatusCodes.CONFLICT);
    }

    const slug = generateCleanSlug(data.businessName);

    const vendor = await this.vendorRepository.create({
      user: userId as unknown as IVendor['user'],
      businessName: data.businessName,
      slug,
      description: data.description,
      phone: data.phone,
      address: data.address,
      status: VendorStatus.PENDING,
    });

    return vendor;
  }

  async getVendorProfile(userId: string): Promise<IVendor> {
    const vendor = await this.vendorRepository.findByUser(userId);
    if (!vendor) {
      throw new AppError('Vendor profile not found', StatusCodes.NOT_FOUND);
    }
    return vendor;
  }

  async updateVendorProfile(userId: string, data: UpdateVendorInput): Promise<IVendor> {
    const vendor = await this.vendorRepository.findByUser(userId);
    if (!vendor) {
      throw new AppError('Vendor profile not found', StatusCodes.NOT_FOUND);
    }

    const updateData: Partial<IVendor> = { ...data } as Partial<IVendor>;
    if (data.businessName) {
      updateData.slug = generateCleanSlug(data.businessName);
    }

    const updated = await this.vendorRepository.updateByUser(userId, updateData);
    return updated!;
  }

  async getVendorProducts(userId: string, page: number, limit: number): Promise<{
    products: unknown[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.productRepository.findByVendor(userId, page, limit);
    return { ...result, page, limit };
  }

  async getSalesAnalytics(userId: string): Promise<{
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
  }> {
    const vendor = await this.vendorRepository.findByUser(userId);
    if (!vendor) {
      throw new AppError('Vendor profile not found', StatusCodes.NOT_FOUND);
    }

    return {
      totalProducts: vendor.totalProducts,
      totalSales: vendor.totalSales,
      totalRevenue: vendor.totalRevenue,
    };
  }

  async listVendors(page: number, limit: number, status?: string): Promise<{
    vendors: IVendor[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    const result = await this.vendorRepository.findAll(page, limit, filters);
    return { ...result, page, limit };
  }

  async approveVendor(vendorId: string): Promise<IVendor> {
    const vendor = await this.vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new AppError('Vendor not found', StatusCodes.NOT_FOUND);
    }

    const updated = await this.vendorRepository.update(vendorId, {
      status: VendorStatus.APPROVED,
      approvedAt: new Date(),
    });

    // Update user role to vendor
    await User.findByIdAndUpdate(vendor.user, { role: Role.VENDOR });

    return updated!;
  }
}
