import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { Role } from '@shared/types/enums';
import { ReviewService } from './review.service';

const reviewService = new ReviewService();

export class ReviewController {
  createReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.createReview(req.user!.userId, req.params['productId'] as string, req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Review submitted successfully', data: { review } });
  });

  getProductReviews = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', sortBy, sortOrder } = req.query;
    const result = await reviewService.getProductReviews(
      req.params['productId'] as string, Number(page), Number(limit),
      sortBy as string, sortOrder as 'asc' | 'desc'
    );
    sendSuccess({
      res, message: 'Reviews retrieved',
      data: { reviews: result.reviews },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });

  updateReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.updateReview(req.params['id'] as string, req.user!.userId, req.body);
    sendSuccess({ res, message: 'Review updated', data: { review } });
  });

  deleteReview = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const isAdmin = req.user!.role === Role.ADMIN;
    await reviewService.deleteReview(req.params['id'] as string, req.user!.userId, isAdmin);
    sendSuccess({ res, message: 'Review deleted' });
  });
}
