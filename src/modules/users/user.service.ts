import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '@shared/middlewares/upload.middleware';
import { UserRepository } from './user.repository';
import { UpdateProfileInput, AddAddressInput, UpdateAddressInput } from './user.dto';
import { IUser } from './user.model';
import { FilterQuery } from 'mongoose';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    const user = await this.userRepository.update(userId, data);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
  }

  async uploadAvatar(userId: string, fileBuffer: Buffer): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    // Delete old avatar if exists
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    const result = await uploadToCloudinary(fileBuffer, 'avatars');

    const updatedUser = await this.userRepository.update(userId, {
      avatar: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });

    return updatedUser!;
  }

  async addAddress(userId: string, addressData: AddAddressInput): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    // If new address is default, unset existing default
    if (addressData.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push(addressData);
    await user.save();
    return user;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressInput
  ): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    const address = user.addresses.find(
      (addr) => addr._id?.toString() === addressId
    );
    if (!address) {
      throw new AppError('Address not found', StatusCodes.NOT_FOUND);
    }

    // If setting as default, unset others
    if (data.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    Object.assign(address, data);
    await user.save();
    return user;
  }

  async deleteAddress(userId: string, addressId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === addressId
    );
    if (addressIndex === -1) {
      throw new AppError('Address not found', StatusCodes.NOT_FOUND);
    }

    user.addresses.splice(addressIndex, 1);
    await user.save();
    return user;
  }

  async listUsers(
    page: number,
    limit: number,
    role?: string,
    search?: string,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: IUser[]; total: number; page: number; limit: number }> {
    const query: FilterQuery<IUser> = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const { users, total } = await this.userRepository.findAll(
      query, page, limit, sortBy, sortOrder
    );

    return { users, total, page, limit };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
  }
}
