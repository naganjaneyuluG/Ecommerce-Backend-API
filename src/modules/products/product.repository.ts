import Product, { IProduct } from './product.model';
import { FilterQuery } from 'mongoose';

export class ProductRepository {
  async create(data: Partial<IProduct>): Promise<IProduct> {
    const product = new Product(data);
    return product.save();
  }

  async findById(productId: string): Promise<IProduct | null> {
    return Product.findById(productId)
      .populate('category', 'name slug')
      .populate('vendor', 'name email')
      .exec();
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    return Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .populate('vendor', 'name email')
      .exec();
  }

  async findAll(
    query: FilterQuery<IProduct>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('vendor', 'name email')
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(query),
    ]);
    return { products, total };
  }

  async fullTextSearch(
    searchQuery: string,
    filters: FilterQuery<IProduct>,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: FilterQuery<IProduct> = {
      $text: { $search: searchQuery },
      ...filters,
    };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('vendor', 'name email')
        .sort(sortBy === 'relevance' ? { score: { $meta: 'textScore' } } : { [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Product.countDocuments(query),
    ]);
    return { products, total };
  }

  async update(productId: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(productId, data, { new: true })
      .populate('category', 'name slug')
      .populate('vendor', 'name email')
      .exec();
  }

  async delete(productId: string): Promise<IProduct | null> {
    return Product.findByIdAndDelete(productId).exec();
  }

  async updateRating(productId: string, avgRating: number, totalReviews: number): Promise<void> {
    await Product.findByIdAndUpdate(productId, { avgRating, totalReviews }).exec();
  }

  async findByVendor(vendorId: string, page: number, limit: number): Promise<{ products: IProduct[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = { vendor: vendorId };
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Product.countDocuments(query),
    ]);
    return { products, total };
  }

  async countAll(): Promise<number> {
    return Product.countDocuments({ isActive: true }).exec();
  }
}
