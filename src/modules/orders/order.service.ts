import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { OrderStatus, PaymentProvider } from '@shared/types/enums';
import { OrderRepository } from './order.repository';
import { IOrder } from './order.model';
import { PlaceOrderInput } from './order.dto';
import Cart from '@modules/cart/cart.model';
import Product from '@modules/products/product.model';
import Inventory from '@modules/inventory/inventory.model';
import Coupon from '@modules/coupons/coupon.model';
import { getEmailQueue, getOrderQueue } from '@shared/jobs/queues';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  async placeOrder(userId: string, data: PlaceOrderInput): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get cart
      const cart = await Cart.findOne({ user: userId })
        .populate('items.product')
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', StatusCodes.BAD_REQUEST);
      }

      // Validate inventory for each item
      const orderItems = [];
      for (const item of cart.items) {
        const product = await Product.findById(item.product).session(session);
        if (!product || !product.isActive) {
          throw new AppError(`Product ${item.product} is unavailable`, StatusCodes.BAD_REQUEST);
        }

        const inventory = await Inventory.findOne({ product: product._id }).session(session);
        if (!inventory || inventory.quantity - inventory.reservedQuantity < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}`, StatusCodes.BAD_REQUEST);
        }

        // Reserve inventory
        inventory.reservedQuantity += item.quantity;
        await inventory.save({ session });

        orderItems.push({
          product: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: item.price,
          vendor: product.vendor,
        });
      }

      // Create order
      const orderNumber = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
      const order = new (mongoose.model<IOrder>('Order'))({
        user: userId,
        orderNumber,
        items: orderItems,
        shippingAddress: data.shippingAddress,
        subtotal: cart.subtotal,
        couponDiscount: cart.couponDiscount,
        totalAmount: cart.totalPrice,
        coupon: cart.coupon,
        status: OrderStatus.PENDING,
      });

      await order.save({ session });

      // Update coupon usage if applied
      if (cart.coupon) {
        await Coupon.findByIdAndUpdate(
          cart.coupon,
          {
            $inc: { usedCount: 1 },
            $push: { usageHistory: { user: userId, usedAt: new Date() } },
          },
          { session }
        );
      }

      // Clear cart
      cart.items = [];
      cart.coupon = undefined;
      cart.couponDiscount = 0;
      cart.subtotal = 0;
      cart.totalPrice = 0;
      await cart.save({ session });

      await session.commitTransaction();

      // Dispatch background jobs
      const orderQueue = getOrderQueue();
      if (orderQueue) {
        await orderQueue.add('process-order', {
          orderId: order._id,
          userId,
          paymentProvider: data.paymentProvider,
        });
      }

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getOrderHistory(
    userId: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const filters = status ? { status } : {};
    const result = await this.orderRepository.findByUser(userId, page, limit, filters);
    return { ...result, page, limit };
  }

  async getOrderById(orderId: string, userId: string, isAdmin: boolean): Promise<IOrder> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }

    if (!isAdmin && order.user.toString() !== userId) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<IOrder> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }

    if (order.user.toString() !== userId) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }

    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', StatusCodes.BAD_REQUEST);
    }

    // Release reserved inventory
    for (const item of order.items) {
      await Inventory.findOneAndUpdate(
        { product: item.product },
        { $inc: { reservedQuantity: -item.quantity } }
      );
    }

    const updated = await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason,
    });

    // Send cancellation email
    const emailQueue = getEmailQueue();
    if (emailQueue) {
      await emailQueue.add('order-cancelled', {
        userId,
        orderId: order.orderNumber,
      });
    }

    return updated!;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    }

    const updateData: Partial<IOrder> = { status };

    if (status === OrderStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();

      // Release reserved and deduct actual inventory
      for (const item of order.items) {
        await Inventory.findOneAndUpdate(
          { product: item.product },
          { $inc: { quantity: -item.quantity, reservedQuantity: -item.quantity } }
        );
      }
    }

    const updated = await this.orderRepository.update(orderId, updateData);
    return updated!;
  }
}
