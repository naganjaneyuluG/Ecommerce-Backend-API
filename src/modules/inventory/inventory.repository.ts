import Inventory, { IInventory } from './inventory.model';

export class InventoryRepository {
  async findByProduct(productId: string, variant?: string): Promise<IInventory | null> {
    const query: Record<string, unknown> = { product: productId };
    if (variant) query.variant = variant;
    return Inventory.findOne(query).populate('product', 'name slug sku').exec();
  }

  async create(data: Partial<IInventory>): Promise<IInventory> {
    return new Inventory(data).save();
  }

  async update(productId: string, data: Partial<IInventory>, variant?: string): Promise<IInventory | null> {
    const query: Record<string, unknown> = { product: productId };
    if (variant) query.variant = variant;
    return Inventory.findOneAndUpdate(query, data, { new: true, upsert: true })
      .populate('product', 'name slug sku')
      .exec();
  }

  async findLowStock(page: number, limit: number): Promise<{ items: IInventory[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = { $expr: { $lte: ['$quantity', '$lowStockThreshold'] } };
    const [items, total] = await Promise.all([
      Inventory.find(query)
        .populate('product', 'name slug sku price')
        .sort({ quantity: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Inventory.countDocuments(query),
    ]);
    return { items, total };
  }
}
