import { StatusCodes } from 'http-status-codes';
import { FilterQuery } from 'mongoose';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { generateSlug } from '@shared/utils/slug.util';
import { uploadToCloudinary, deleteFromCloudinary } from '@shared/middlewares/upload.middleware';
import { ProductRepository } from './product.repository';
import { IProduct } from './product.model';
import { CreateProductInput, UpdateProductInput } from './product.dto';

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  async createProduct(vendorId: string, data: CreateProductInput): Promise<IProduct> {
    const slug = generateSlug(data.name);

    const product = await this.productRepository.create({
      ...data,
      slug,
      vendor: vendorId as unknown as IProduct['vendor'],
      category: data.category as unknown as IProduct['category'],
    });

    return product;
  }

  async getProducts(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    vendor?: string;
    tags?: string;
    isFeatured?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ products: IProduct[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const filters: FilterQuery<IProduct> = { isActive: true };

    if (query.category) filters.category = query.category;
    if (query.vendor) filters.vendor = query.vendor;
    if (query.isFeatured === 'true') filters.isFeatured = true;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filters.price = {};
      if (query.minPrice !== undefined) filters.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filters.price.$lte = query.maxPrice;
    }
    if (query.minRating !== undefined) {
      filters.avgRating = { $gte: query.minRating };
    }
    if (query.tags) {
      const tagList = query.tags.split(',').map((t) => t.trim());
      filters.tags = { $in: tagList };
    }

    let result: { products: IProduct[]; total: number };

    if (query.search) {
      result = await this.productRepository.fullTextSearch(
        query.search, filters, page, limit, sortBy, sortOrder
      );
    } else {
      result = await this.productRepository.findAll(
        filters, page, limit, sortBy, sortOrder
      );
    }

    return { ...result, page, limit };
  }

  async getProductBySlug(slug: string): Promise<IProduct> {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) {
      throw new AppError('Product not found', StatusCodes.NOT_FOUND);
    }
    return product;
  }

  async updateProduct(productId: string, vendorId: string, data: UpdateProductInput, isAdmin: boolean): Promise<IProduct> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', StatusCodes.NOT_FOUND);
    }

    if (!isAdmin && product.vendor.toString() !== vendorId) {
      throw new AppError('You can only update your own products', StatusCodes.FORBIDDEN);
    }

    const updateData: Partial<IProduct> = { ...data } as Partial<IProduct>;
    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }

    const updatedProduct = await this.productRepository.update(productId, updateData);
    return updatedProduct!;
  }

  async deleteProduct(productId: string, vendorId: string, isAdmin: boolean): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', StatusCodes.NOT_FOUND);
    }

    if (!isAdmin && product.vendor.toString() !== vendorId) {
      throw new AppError('You can only delete your own products', StatusCodes.FORBIDDEN);
    }

    // Delete images from Cloudinary
    for (const img of product.images) {
      await deleteFromCloudinary(img.publicId);
    }

    await this.productRepository.delete(productId);
  }

  async uploadImages(productId: string, vendorId: string, files: Express.Multer.File[], isAdmin: boolean): Promise<IProduct> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', StatusCodes.NOT_FOUND);
    }

    if (!isAdmin && product.vendor.toString() !== vendorId) {
      throw new AppError('You can only upload images to your own products', StatusCodes.FORBIDDEN);
    }

    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file.buffer, 'products')
    );
    const results = await Promise.all(uploadPromises);

    const newImages = results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: product.images.length === 0 && index === 0,
    }));

    product.images.push(...newImages);
    await product.save();

    return product;
  }
}
