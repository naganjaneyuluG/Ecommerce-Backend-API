import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { InventoryRepository } from './inventory.repository';
import { IInventory } from './inventory.model';
import { UpdateInventoryInput } from './inventory.dto';
import Product from '@modules/products/product.model';
import { getEmailQueue } from '@shared/jobs/queues';

export class InventoryService {
  private inventoryRepository: InventoryRepository;

  constructor() {
    this.inventoryRepository = new InventoryRepository();
  }

  async getStock(productId: string): Promise<IInventory> {
    const inventory = await this.inventoryRepository.findByProduct(productId);
    if (!inventory) {
      throw new AppError('Inventory record not found', StatusCodes.NOT_FOUND);
    }
    return inventory;
  }

  async updateStock(productId: string, data: UpdateInventoryInput): Promise<IInventory> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', StatusCodes.NOT_FOUND);
    }

    const inventory = await this.inventoryRepository.update(productId, {
      quantity: data.quantity,
      ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
      sku: product.sku,
      lastRestockedAt: new Date(),
    }, data.variant);

    // Check for low stock and send alert
    if (inventory && inventory.quantity <= inventory.lowStockThreshold) {
      const emailQueue = getEmailQueue();
      if (emailQueue) {
        await emailQueue.add('low-stock-alert', {
          productId,
          productName: product.name,
          currentStock: inventory.quantity,
        });
      }
    }

    return inventory!;
  }

  async getLowStockItems(page: number, limit: number): Promise<{ items: IInventory[]; total: number; page: number; limit: number }> {
    const result = await this.inventoryRepository.findLowStock(page, limit);
    return { ...result, page, limit };
  }
}
