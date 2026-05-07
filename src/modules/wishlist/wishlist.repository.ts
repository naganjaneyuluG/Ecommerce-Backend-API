import Wishlist, { IWishlist } from './wishlist.model';

export class WishlistRepository {
  async findByUser(userId: string): Promise<IWishlist | null> {
    return Wishlist.findOne({ user: userId })
      .populate('products', 'name slug price images avgRating isActive')
      .exec();
  }

  async findOrCreate(userId: string): Promise<IWishlist> {
    let wishlist = await this.findByUser(userId);
    if (!wishlist) {
      wishlist = await new Wishlist({ user: userId, products: [] }).save();
    }
    return wishlist;
  }

  async save(wishlist: IWishlist): Promise<IWishlist> {
    return wishlist.save();
  }
}
