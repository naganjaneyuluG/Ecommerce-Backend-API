import { Router } from 'express';
import { WishlistController } from './wishlist.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { wishlistProductParamsDto } from './wishlist.dto';

const router = Router();
const wishlistController = new WishlistController();

router.use(authenticate);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     tags: [Wishlist]
 *     summary: Get user's wishlist
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Wishlist retrieved
 */
router.get('/', wishlistController.getWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   post:
 *     tags: [Wishlist]
 *     summary: Add product to wishlist
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Product added to wishlist
 */
router.post('/:productId', validate({ params: wishlistProductParamsDto }), wishlistController.addProduct);

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     tags: [Wishlist]
 *     summary: Remove product from wishlist
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Product removed
 */
router.delete('/:productId', validate({ params: wishlistProductParamsDto }), wishlistController.removeProduct);

/**
 * @swagger
 * /wishlist/{productId}/move-to-cart:
 *   post:
 *     tags: [Wishlist]
 *     summary: Move product from wishlist to cart
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Product moved to cart
 */
router.post('/:productId/move-to-cart', validate({ params: wishlistProductParamsDto }), wishlistController.moveToCart);

export default router;
