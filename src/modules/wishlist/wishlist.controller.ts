import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { WishlistService } from './wishlist.service';

const wishlistService = new WishlistService();

export class WishlistController {
  getWishlist = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const wishlist = await wishlistService.getWishlist(req.user!.userId);
    sendSuccess({ res, message: 'Wishlist retrieved', data: { wishlist } });
  });

  addProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const wishlist = await wishlistService.addProduct(req.user!.userId, req.params['productId'] as string);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Product added to wishlist', data: { wishlist } });
  });

  removeProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const wishlist = await wishlistService.removeProduct(req.user!.userId, req.params['productId'] as string);
    sendSuccess({ res, message: 'Product removed from wishlist', data: { wishlist } });
  });

  moveToCart = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const wishlist = await wishlistService.moveToCart(req.user!.userId, req.params['productId'] as string);
    sendSuccess({ res, message: 'Product moved to cart', data: { wishlist } });
  });
}
