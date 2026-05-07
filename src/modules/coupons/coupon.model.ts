import mongoose, { Document, Schema } from 'mongoose';
import { CouponType } from '@shared/types/enums';

export interface ICouponUsage {
  user: mongoose.Types.ObjectId;
  usedAt: Date;
}

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  description?: string;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  usageHistory: ICouponUsage[];
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponUsageSchema = new Schema<ICouponUsage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(CouponType),
      required: [true, 'Coupon type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [0, 'Value cannot be negative'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    usageHistory: [couponUsageSchema],
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


couponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon;
