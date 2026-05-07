import { Request, Response } from 'express';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { AdminService } from './admin.service';

const adminService = new AdminService();

export class AdminController {
  getDashboard = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const stats = await adminService.getDashboardStats();
    sendSuccess({ res, message: 'Dashboard stats retrieved', data: { stats } });
  });

  getUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', role, search } = req.query;
    const result = await adminService.getUsers(Number(page), Number(limit), role as string, search as string);
    sendSuccess({
      res, message: 'Users retrieved',
      data: { users: result.users },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  changeUserRole = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await adminService.changeUserRole(req.params['id'] as string, req.body.role);
    sendSuccess({ res, message: 'User role updated', data: { user } });
  });

  getAllOrders = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', status, sortBy, sortOrder } = req.query;
    const result = await adminService.getAllOrders(
      Number(page), Number(limit), status as string, sortBy as string, sortOrder as 'asc' | 'desc'
    );
    sendSuccess({
      res, message: 'Orders retrieved',
      data: { orders: result.orders },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  getRevenueAnalytics = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate } = req.query;
    const analytics = await adminService.getRevenueAnalytics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    sendSuccess({ res, message: 'Revenue analytics retrieved', data: { analytics } });
  });
}
