import Notification, { INotification } from './notification.model';
import { FilterQuery } from 'mongoose';

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return new Notification(data).save();
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
    filters: FilterQuery<INotification> = {}
  ): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = { user: userId, ...filters };
    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Notification.countDocuments(query),
    ]);
    return { notifications, total };
  }

  async findById(id: string): Promise<INotification | null> {
    return Notification.findById(id).exec();
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true }).exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await Notification.findByIdAndDelete(id).exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, isRead: false }).exec();
  }
}
