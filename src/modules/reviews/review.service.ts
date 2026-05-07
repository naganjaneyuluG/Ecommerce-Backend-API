import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { OrderStatus } from '@shared/types/enums';
import { ReviewRepository } from './review.repository';
import { IReview } from './review.model';
import { CreateReviewInput, UpdateReviewInput } from './review.dto';
import Product from '@modules/products/product.model';
import Order from '@modules/orders/order.model';

export class ReviewService {
  private reviewRepository: ReviewRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
  }

  async createReview(userId: string, productId: string, data: CreateReviewInput): Promise<IReview> {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found', StatusCodes.NOT_FOUND);
    }

    const existing = await this.reviewRepository.findByUserAndProduct(userId, productId);
    if (existing) {
      throw new AppError('You have already reviewed this product', StatusCodes.CONFLICT);
    }

    // Check if user has a delivered order with this product
    const hasOrder = await Order.findOne({
      user: userId,
      'items.product': new mongoose.Types.ObjectId(productId),
      status: OrderStatus.DELIVERED,
    });

    const review = await this.reviewRepository.create({
      user: userId as unknown as IReview['user'],
      product: productId as unknown as IReview['product'],
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      isVerifiedPurchase: !!hasOrder,
    });

    // Update product aggregate rating
    await this.updateProductRating(productId);

    return review;
  }

  async getProductReviews(
    productId: string,
    page: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ reviews: IReview[]; total: number; page: number; limit: number }> {
    const result = await this.reviewRepository.findByProduct(productId, page, limit, sortBy, sortOrder);
    return { ...result, page, limit };
  }

  async updateReview(reviewId: string, userId: string, data: UpdateReviewInput): Promise<IReview> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', StatusCodes.NOT_FOUND);
    }

    if (review.user.toString() !== userId) {
      throw new AppError('You can only update your own reviews', StatusCodes.FORBIDDEN);
    }

    const updated = await this.reviewRepository.update(reviewId, data);

    // Update product aggregate rating if rating changed
    if (data.rating) {
      await this.updateProductRating(review.product.toString());
    }

    return updated!;
  }

  async deleteReview(reviewId: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', StatusCodes.NOT_FOUND);
    }

    if (!isAdmin && review.user.toString() !== userId) {
      throw new AppError('You can only delete your own reviews', StatusCodes.FORBIDDEN);
    }

    const productId = review.product.toString();
    await this.reviewRepository.delete(reviewId);
    await this.updateProductRating(productId);
  }

  private async updateProductRating(productId: string): Promise<void> {
    const { avgRating, totalReviews } = await this.reviewRepository.getAggregateRating(productId);
    await Product.findByIdAndUpdate(productId, { avgRating, totalReviews });
  }
}
