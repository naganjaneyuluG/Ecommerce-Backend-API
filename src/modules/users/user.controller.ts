import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { UserService } from './user.service';

const userService = new UserService();

export class UserController {
  getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getProfile(req.user!.userId);
    sendSuccess({ res, message: 'Profile retrieved successfully', data: { user } });
  });

  updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateProfile(req.user!.userId, req.body);
    sendSuccess({ res, message: 'Profile updated successfully', data: { user } });
  });

  uploadAvatar = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Please upload an image file',
        statusCode: StatusCodes.BAD_REQUEST,
      });
      return;
    }
    const user = await userService.uploadAvatar(req.user!.userId, req.file.buffer);
    sendSuccess({ res, message: 'Avatar uploaded successfully', data: { user } });
  });

  addAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.addAddress(req.user!.userId, req.body);
    sendSuccess({
      res,
      statusCode: StatusCodes.CREATED,
      message: 'Address added successfully',
      data: { addresses: user.addresses },
    });
  });

  updateAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateAddress(
      req.user!.userId,
      req.params['addressId'] as string,
      req.body
    );
    sendSuccess({ res, message: 'Address updated successfully', data: { addresses: user.addresses } });
  });

  deleteAddress = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.deleteAddress(
      req.user!.userId,
      req.params['addressId'] as string
    );
    sendSuccess({ res, message: 'Address deleted successfully', data: { addresses: user.addresses } });
  });

  listUsers = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, role, search, sortBy, sortOrder } = req.query;
    const result = await userService.listUsers(
      Number(page), Number(limit),
      role as string, search as string,
      sortBy as string, sortOrder as 'asc' | 'desc'
    );
    sendSuccess({
      res,
      message: 'Users retrieved successfully',
      data: { users: result.users },
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  });

  getUserById = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getUserById(req.params['id'] as string);
    sendSuccess({ res, message: 'User retrieved successfully', data: { user } });
  });
}
