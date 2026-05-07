import User, { IUser } from './user.model';
import { FilterQuery } from 'mongoose';

export class UserRepository {
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  async findAll(
    query: FilterQuery<IUser>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(query),
    ]);
    return { users, total };
  }

  async update(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, data, { new: true }).exec();
  }

  async delete(userId: string): Promise<IUser | null> {
    return User.findByIdAndDelete(userId).exec();
  }

  async countByRole(role: string): Promise<number> {
    return User.countDocuments({ role }).exec();
  }

  async countAll(): Promise<number> {
    return User.countDocuments().exec();
  }
}
