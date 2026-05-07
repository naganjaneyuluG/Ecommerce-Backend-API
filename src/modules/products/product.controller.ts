import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { Role } from '@shared/types/enums';
import { ProductService } from './product.service';

const productService = new ProductService();

export class ProductController {
  createProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const product = await productService.createProduct(req.user!.userId, req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Product created successfully', data: { product } });
  });

  getProducts = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const result = await productService.getProducts(req.query as Record<string, string>);
    sendSuccess({
      res,
      message: 'Products retrieved successfully',
      data: { products: result.products },
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    });
  });

  getProductBySlug = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const product = await productService.getProductBySlug(req.params['slug'] as string);
    sendSuccess({ res, message: 'Product retrieved successfully', data: { product } });
  });

  updateProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const isAdmin = req.user!.role === Role.ADMIN;
    const product = await productService.updateProduct(req.params['id'] as string, req.user!.userId, req.body, isAdmin);
    sendSuccess({ res, message: 'Product updated successfully', data: { product } });
  });

  deleteProduct = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const isAdmin = req.user!.role === Role.ADMIN;
    await productService.deleteProduct(req.params['id'] as string, req.user!.userId, isAdmin);
    sendSuccess({ res, message: 'Product deleted successfully' });
  });

  uploadImages = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Please upload at least one image', statusCode: 400 });
      return;
    }
    const isAdmin = req.user!.role === Role.ADMIN;
    const product = await productService.uploadImages(req.params['id'] as string, req.user!.userId, files, isAdmin);
    sendSuccess({ res, message: 'Images uploaded successfully', data: { images: product.images } });
  });
}
