import { Router } from 'express';
import { CartController } from './cart.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { addToCartDto, updateCartItemDto, cartProductParamsDto, applyCouponDto } from './cart.dto';

const router = Router();
const cartController = new CartController();

router.use(authenticate);

/**
 * @swagger
 * /cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get user's cart
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart retrieved
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product]
 *             properties:
 *               product:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       201:
 *         description: Item added to cart
 */
router.post('/items', validate({ body: addToCartDto }), cartController.addItem);

/**
 * @swagger
 * /cart/items/{productId}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/items/:productId', validate({ params: cartProductParamsDto, body: updateCartItemDto }), cartController.updateItem);

/**
 * @swagger
 * /cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/items/:productId', validate({ params: cartProductParamsDto }), cartController.removeItem);

/**
 * @swagger
 * /cart/coupon:
 *   post:
 *     tags: [Cart]
 *     summary: Apply coupon to cart
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coupon applied
 */
router.post('/coupon', validate({ body: applyCouponDto }), cartController.applyCoupon);

/**
 * @swagger
 * /cart/coupon:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove coupon from cart
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coupon removed
 */
router.delete('/coupon', cartController.removeCoupon);

/**
 * @swagger
 * /cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', cartController.clearCart);

export default router;
