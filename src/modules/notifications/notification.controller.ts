import { Request, Response } from 'express';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  getNotifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '20', isRead } = req.query;
    const result = await notificationService.getNotifications(req.user!.userId, Number(page), Number(limit), isRead as string);
    sendSuccess({
      res, message: 'Notifications retrieved',
      data: { notifications: result.notifications, unreadCount: result.unreadCount },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  markAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const notification = await notificationService.markAsRead(req.params['id'] as string, req.user!.userId);
    sendSuccess({ res, message: 'Notification marked as read', data: { notification } });
  });

  markAllAsRead = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await notificationService.markAllAsRead(req.user!.userId);
    sendSuccess({ res, message: 'All notifications marked as read' });
  });

  deleteNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await notificationService.deleteNotification(req.params['id'] as string, req.user!.userId);
    sendSuccess({ res, message: 'Notification deleted' });
  });
}
