import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { CategoryService } from './category.service';

const categoryService = new CategoryService();

export class CategoryController {
  create = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.createCategory(req.body);
    sendSuccess({ res, statusCode: StatusCodes.CREATED, message: 'Category created successfully', data: { category } });
  });

  getAll = catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const categories = await categoryService.getAllCategories();
    sendSuccess({ res, message: 'Categories retrieved successfully', data: { categories } });
  });

  getBySlug = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.getCategoryBySlug(req.params['slug'] as string);
    sendSuccess({ res, message: 'Category retrieved successfully', data: { category } });
  });

  update = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.updateCategory(req.params['id'] as string, req.body);
    sendSuccess({ res, message: 'Category updated successfully', data: { category } });
  });

  delete = catchAsync(async (req: Request, res: Response): Promise<void> => {
    await categoryService.deleteCategory(req.params['id'] as string);
    sendSuccess({ res, message: 'Category deleted successfully' });
  });
}
