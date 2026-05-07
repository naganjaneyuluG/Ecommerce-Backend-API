import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { Role } from '@shared/types/enums';
import { UserRepository } from '@modules/users/user.repository';
import { OrderRepository } from '@modules/orders/order.repository';
import { ProductRepository } from '@modules/products/product.repository';
import { IUser } from '@modules/users/user.model';
import { IOrder } from '@modules/orders/order.model';

interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export class AdminService {
  private userRepository: UserRepository;
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalProducts,
      revenueStats,
      pendingOrders,
    ] = await Promise.all([
      this.userRepository.countAll(),
      this.userRepository.countByRole(Role.CUSTOMER),
      this.userRepository.countByRole(Role.VENDOR),
      this.productRepository.countAll(),
      this.orderRepository.getRevenueStats(),
      this.orderRepository.countAll({ status: 'pending' }),
    ]);

    return {
      totalUsers,
      totalCustomers,
      totalVendors,
      totalProducts,
      totalOrders: revenueStats.totalOrders,
      totalRevenue: revenueStats.totalRevenue,
      pendingOrders,
    };
  }

  async getUsers(
    page: number,
    limit: number,
    role?: string,
    search?: string
  ): Promise<{ users: IUser[]; total: number; page: number; limit: number }> {
    const query: Record<string, unknown> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const { users, total } = await this.userRepository.findAll(query, page, limit, 'createdAt', 'desc');
    return { users, total, page, limit };
  }

  async changeUserRole(userId: string, newRole: string): Promise<IUser> {
    if (!Object.values(Role).includes(newRole as Role)) {
      throw new AppError('Invalid role', StatusCodes.BAD_REQUEST);
    }

    const user = await this.userRepository.update(userId, { role: newRole as Role });
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
  }

  async getAllOrders(
    page: number,
    limit: number,
    status?: string,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    const result = await this.orderRepository.findAll(page, limit, filters, sortBy, sortOrder);
    return { ...result, page, limit };
  }

  async getRevenueAnalytics(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  }> {
    const stats = await this.orderRepository.getRevenueStats(startDate, endDate);
    return {
      ...stats,
      averageOrderValue: stats.totalOrders > 0 ? Math.round((stats.totalRevenue / stats.totalOrders) * 100) / 100 : 0,
    };
  }
}
