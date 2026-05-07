import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  product: mongoose.Types.ObjectId;
  variant?: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  sku: string;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variant: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    lastRestockedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, variant: 1 }, { unique: true });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ quantity: 1 });

// Virtual for available quantity
inventorySchema.virtual('availableQuantity').get(function (this: IInventory) {
  return this.quantity - this.reservedQuantity;
});

// Virtual to check if low stock
inventorySchema.virtual('isLowStock').get(function (this: IInventory) {
  return this.quantity <= this.lowStockThreshold;
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory;
