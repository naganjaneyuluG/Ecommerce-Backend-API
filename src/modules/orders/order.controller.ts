import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { Role, OrderStatus } from '@shared/types/enums';
import { OrderService } from './order.service';

const orderService = new OrderService();

export class OrderController {
  placeOrder = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const order = await orderService.placeOrder(req.user!.userId, req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Order placed successfully', data: { order } });
  });

  getOrderHistory = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', status } = req.query;
    const result = await orderService.getOrderHistory(req.user!.userId, Number(page), Number(limit), status as string);
    sendSuccess({
      res,
      message: 'Order history retrieved',
      data: { orders: result.orders },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  getOrderById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const isAdmin = req.user!.role === Role.ADMIN;
    const order = await orderService.getOrderById(req.params['id'] as string, req.user!.userId, isAdmin);
    sendSuccess({ res, message: 'Order retrieved', data: { order } });
  });

  cancelOrder = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const order = await orderService.cancelOrder(req.params['id'] as string, req.user!.userId, req.body?.reason);
    sendSuccess({ res, message: 'Order cancelled successfully', data: { order } });
  });

  updateOrderStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const order = await orderService.updateOrderStatus(req.params['id'] as string, req.body.status as OrderStatus);
    sendSuccess({ res, message: 'Order status updated', data: { order } });
  });
}
