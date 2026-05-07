import Cart, { ICart } from './cart.model';

export class CartRepository {
  async findByUser(userId: string): Promise<ICart | null> {
    return Cart.findOne({ user: userId })
      .populate('items.product', 'name slug price images isActive')
      .populate('coupon')
      .exec();
  }

  async findOrCreate(userId: string): Promise<ICart> {
    let cart = await this.findByUser(userId);
    if (!cart) {
      cart = await new Cart({ user: userId, items: [] }).save();
    }
    return cart;
  }

  async update(userId: string, data: Partial<ICart>): Promise<ICart | null> {
    return Cart.findOneAndUpdate({ user: userId }, data, { new: true, upsert: true })
      .populate('items.product', 'name slug price images isActive')
      .populate('coupon')
      .exec();
  }

  async clearCart(userId: string): Promise<void> {
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], coupon: null, couponDiscount: 0, subtotal: 0, totalPrice: 0 }
    ).exec();
  }

  async deleteCart(userId: string): Promise<void> {
    await Cart.findOneAndDelete({ user: userId }).exec();
  }
}
