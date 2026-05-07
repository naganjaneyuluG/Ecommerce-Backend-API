import Review, { IReview } from './review.model';

export class ReviewRepository {
  async create(data: Partial<IReview>): Promise<IReview> {
    return new Review(data).save();
  }

  async findById(reviewId: string): Promise<IReview | null> {
    return Review.findById(reviewId).populate('user', 'name avatar').exec();
  }

  async findByUserAndProduct(userId: string, productId: string): Promise<IReview | null> {
    return Review.findOne({ user: userId, product: productId }).exec();
  }

  async findByProduct(
    productId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ reviews: IReview[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = { product: productId, isActive: true };
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name avatar')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Review.countDocuments(query),
    ]);
    return { reviews, total };
  }

  async update(reviewId: string, data: Partial<IReview>): Promise<IReview | null> {
    return Review.findByIdAndUpdate(reviewId, data, { new: true })
      .populate('user', 'name avatar')
      .exec();
  }

  async delete(reviewId: string): Promise<void> {
    await Review.findByIdAndDelete(reviewId).exec();
  }

  async getAggregateRating(productId: string): Promise<{ avgRating: number; totalReviews: number }> {
    const result = await Review.aggregate([
      { $match: { product: productId, isActive: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return {
      avgRating: result[0]?.avgRating ? Math.round(result[0].avgRating * 10) / 10 : 0,
      totalReviews: result[0]?.totalReviews ?? 0,
    };
  }
}
