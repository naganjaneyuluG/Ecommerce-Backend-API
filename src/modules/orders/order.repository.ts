import Order, { IOrder } from './order.model';
import { FilterQuery } from 'mongoose';

export class OrderRepository {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    return new Order(data).save();
  }

  async findById(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId)
      .populate('items.product', 'name slug images')
      .populate('payment')
      .exec();
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
    filters: FilterQuery<IOrder> = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    const query = { user: userId, ...filters };
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name slug images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Order.countDocuments(query),
    ]);
    return { orders, total };
  }

  async findAll(
    page: number,
    limit: number,
    filters: FilterQuery<IOrder> = {},
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(filters)
        .populate('user', 'name email')
        .populate('items.product', 'name slug images')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Order.countDocuments(filters),
    ]);
    return { orders, total };
  }

  async update(orderId: string, data: Partial<IOrder>): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(orderId, data, { new: true })
      .populate('items.product', 'name slug images')
      .populate('payment')
      .exec();
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<{ totalRevenue: number; totalOrders: number }> {
    const match: FilterQuery<IOrder> = { status: { $nin: ['cancelled', 'refunded'] } };
    if (startDate) match.createdAt = { $gte: startDate };
    if (endDate) {
      match.createdAt = { ...match.createdAt as Record<string, unknown>, $lte: endDate };
    }

    const result = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    return {
      totalRevenue: result[0]?.totalRevenue ?? 0,
      totalOrders: result[0]?.totalOrders ?? 0,
    };
  }

  async countAll(filters: FilterQuery<IOrder> = {}): Promise<number> {
    return Order.countDocuments(filters).exec();
  }
}
