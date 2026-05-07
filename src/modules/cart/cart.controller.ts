import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { CartService } from './cart.service';

const cartService = new CartService();

export class CartController {
  getCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const cart = await cartService.getCart(req.user!.userId);
    sendSuccess({ res, message: 'Cart retrieved successfully', data: { cart } });
  });

  addItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const cart = await cartService.addItem(req.user!.userId, req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Item added to cart', data: { cart } });
  });

  updateItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const cart = await cartService.updateItem(req.user!.userId, req.params['productId'] as string, req.body);
    sendSuccess({ res, message: 'Cart item updated', data: { cart } });
  });

  removeItem = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const cart = await cartService.removeItem(req.user!.userId, req.params['productId'] as string);
    sendSuccess({ res, message: 'Item removed from cart', data: { cart } });
  });

  applyCoupon = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const cart = await cartService.applyCoupon(req.user!.userId, req.body.code);
    sendSuccess({ res, message: 'Coupon applied successfully', data: { cart } });
  });

  removeCoupon = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const cart = await cartService.removeCoupon(req.user!.userId);
    sendSuccess({ res, message: 'Coupon removed', data: { cart } });
  });

  clearCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await cartService.clearCart(req.user!.userId);
    sendSuccess({ res, message: 'Cart cleared successfully' });
  });
}
