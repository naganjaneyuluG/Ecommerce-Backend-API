import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { NotificationRepository } from './notification.repository';
import { INotification } from './notification.model';
import { NotificationType } from '@shared/types/enums';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async getNotifications(
    userId: string,
    page: number,
    limit: number,
    isRead?: string
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number; page: number; limit: number }> {
    const filters: Record<string, unknown> = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';

    const [result, unreadCount] = await Promise.all([
      this.notificationRepository.findByUser(userId, page, limit, filters),
      this.notificationRepository.getUnreadCount(userId),
    ]);

    return { ...result, unreadCount, page, limit };
  }

  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.user.toString() !== userId) {
      throw new AppError('Notification not found', StatusCodes.NOT_FOUND);
    }

    const updated = await this.notificationRepository.markAsRead(notificationId);
    return updated!;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification || notification.user.toString() !== userId) {
      throw new AppError('Notification not found', StatusCodes.NOT_FOUND);
    }
    await this.notificationRepository.delete(notificationId);
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<INotification> {
    return this.notificationRepository.create({
      user: userId as unknown as INotification['user'],
      type,
      title,
      message,
      data,
    });
  }
}
