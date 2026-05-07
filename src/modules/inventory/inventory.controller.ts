import { Request, Response } from 'express';
import { catchAsync } from '@shared/utils/async-wrapper.util';
import { sendSuccess } from '@shared/utils/response.util';
import { InventoryService } from './inventory.service';

const inventoryService = new InventoryService();

export class InventoryController {
  getStock = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const inventory = await inventoryService.getStock(req.params['productId'] as string);
    sendSuccess({ res, message: 'Stock info retrieved', data: { inventory } });
  });

  updateStock = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const inventory = await inventoryService.updateStock(req.params['productId'] as string, req.body);
    sendSuccess({ res, message: 'Stock updated successfully', data: { inventory } });
  });

  getLowStock = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10' } = req.query;
    const result = await inventoryService.getLowStockItems(Number(page), Number(limit));
    sendSuccess({
      res,
      message: 'Low stock items retrieved',
      data: { items: result.items },
      pagination: { page: result.page, limit: result.limit, total: result.total, pages: Math.ceil(result.total / result.limit) },
    });
  });
}
