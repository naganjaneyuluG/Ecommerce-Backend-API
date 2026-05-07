import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { WishlistRepository } from './wishlist.repository';
import { IWishlist } from './wishlist.model';
import Product from '@modules/products/product.model';
import { CartService } from '@modules/cart/cart.service';

export class WishlistService {
  private wishlistRepository: WishlistRepository;
  private cartService: CartService;

  constructor() {
    this.wishlistRepository = new WishlistRepository();
    this.cartService = new CartService();
  }

  async getWishlist(userId: string): Promise<IWishlist> {
    return this.wishlistRepository.findOrCreate(userId);
  }

  async addProduct(userId: string, productId: string): Promise<IWishlist> {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new AppError('Product not found or unavailable', StatusCodes.NOT_FOUND);
    }

    const wishlist = await this.wishlistRepository.findOrCreate(userId);

    const alreadyExists = wishlist.products.some(
      (p) => p.toString() === productId
    );
    if (alreadyExists) {
      throw new AppError('Product already in wishlist', StatusCodes.CONFLICT);
    }

    wishlist.products.push(productId as unknown as IWishlist['products'][0]);
    await this.wishlistRepository.save(wishlist);

    return this.wishlistRepository.findByUser(userId) as Promise<IWishlist>;
  }

  async removeProduct(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await this.wishlistRepository.findOrCreate(userId);

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await this.wishlistRepository.save(wishlist);

    return this.wishlistRepository.findByUser(userId) as Promise<IWishlist>;
  }

  async moveToCart(userId: string, productId: string): Promise<IWishlist> {
    // Add to cart
    await this.cartService.addItem(userId, { product: productId, quantity: 1 });

    // Remove from wishlist
    return this.removeProduct(userId, productId);
  }
}
