import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { CouponType } from '@shared/types/enums';
import { CartRepository } from './cart.repository';
import { ICart } from './cart.model';
import Product from '@modules/products/product.model';
import Coupon from '@modules/coupons/coupon.model';
import { AddToCartInput, UpdateCartItemInput } from './cart.dto';

export class CartService {
  private cartRepository: CartRepository;

  constructor() {
    this.cartRepository = new CartRepository();
  }

  async getCart(userId: string): Promise<ICart> {
    return this.cartRepository.findOrCreate(userId);
  }

  async addItem(userId: string, data: AddToCartInput): Promise<ICart> {
    const product = await Product.findById(data.product);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or unavailable', StatusCodes.NOT_FOUND);
    }

    const cart = await this.cartRepository.findOrCreate(userId);

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === data.product
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex]!.quantity += data.quantity;
      cart.items[existingItemIndex]!.price = product.price;
    } else {
      cart.items.push({
        product: data.product as unknown as ICart['items'][0]['product'],
        quantity: data.quantity,
        price: product.price,
      });
    }

    this.recalculateTotals(cart);
    await cart.save();

    return this.cartRepository.findByUser(userId) as Promise<ICart>;
  }

  async updateItem(userId: string, productId: string, data: UpdateCartItemInput): Promise<ICart> {
    const cart = await this.cartRepository.findOrCreate(userId);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      throw new AppError('Item not found in cart', StatusCodes.NOT_FOUND);
    }

    cart.items[itemIndex]!.quantity = data.quantity;

    this.recalculateTotals(cart);
    await cart.save();

    return this.cartRepository.findByUser(userId) as Promise<ICart>;
  }

  async removeItem(userId: string, productId: string): Promise<ICart> {
    const cart = await this.cartRepository.findOrCreate(userId);

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    this.recalculateTotals(cart);
    await cart.save();

    return this.cartRepository.findByUser(userId) as Promise<ICart>;
  }

  async applyCoupon(userId: string, code: string): Promise<ICart> {
    const cart = await this.cartRepository.findOrCreate(userId);

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', StatusCodes.BAD_REQUEST);
    }

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      throw new AppError('Invalid coupon code', StatusCodes.NOT_FOUND);
    }

    if (coupon.expiresAt < new Date()) {
      throw new AppError('Coupon has expired', StatusCodes.BAD_REQUEST);
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('Coupon usage limit reached', StatusCodes.BAD_REQUEST);
    }

    // Check per-user limit
    const userUsageCount = coupon.usageHistory.filter(
      (usage) => usage.user.toString() === userId
    ).length;
    if (userUsageCount >= coupon.perUserLimit) {
      throw new AppError('You have already used this coupon the maximum number of times', StatusCodes.BAD_REQUEST);
    }

    if (cart.subtotal < coupon.minOrderAmount) {
      throw new AppError(
        `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`,
        StatusCodes.BAD_REQUEST
      );
    }

    let discount = 0;
    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (cart.subtotal * coupon.value) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.value;
    }

    discount = Math.min(discount, cart.subtotal);

    cart.coupon = coupon._id;
    cart.couponDiscount = discount;
    cart.totalPrice = cart.subtotal - discount;
    await cart.save();

    return this.cartRepository.findByUser(userId) as Promise<ICart>;
  }

  async removeCoupon(userId: string): Promise<ICart> {
    const cart = await this.cartRepository.findOrCreate(userId);

    cart.coupon = undefined;
    cart.couponDiscount = 0;
    cart.totalPrice = cart.subtotal;
    await cart.save();

    return this.cartRepository.findByUser(userId) as Promise<ICart>;
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.clearCart(userId);
  }

  private recalculateTotals(cart: ICart): void {
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.totalPrice = cart.subtotal - cart.couponDiscount;
    if (cart.totalPrice < 0) cart.totalPrice = 0;
  }
}
