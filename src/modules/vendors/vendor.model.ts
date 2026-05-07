import mongoose, { Document, Schema } from 'mongoose';
import { VendorStatus } from '@shared/types/enums';

export interface IVendor extends Document {
  user: mongoose.Types.ObjectId;
  businessName: string;
  slug: string;
  description?: string;
  logo?: {
    url: string;
    publicId: string;
  };
  phone?: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: VendorStatus;
  commission: number;
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: [200, 'Business name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    logo: {
      url: { type: String },
      publicId: { type: String },
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    status: {
      type: String,
      enum: Object.values(VendorStatus),
      default: VendorStatus.PENDING,
    },
    commission: {
      type: Number,
      default: 10, // 10% default commission
      min: 0,
      max: 100,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProducts: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);



vendorSchema.index({ status: 1 });

const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);

export default Vendor;
