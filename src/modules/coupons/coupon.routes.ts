import { Router } from 'express';
import { CouponController } from './coupon.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { Role } from '@shared/types/enums';
import { createCouponDto, updateCouponDto, couponCodeParamsDto, couponIdParamsDto } from './coupon.dto';

const router = Router();
const couponController = new CouponController();

/**
 * @swagger
 * /coupons/{code}:
 *   get:
 *     tags: [Coupons]
 *     summary: Validate a coupon code
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Coupon is valid
 */
router.get('/:code', authenticate, validate({ params: couponCodeParamsDto }), couponController.validate);

// Admin routes
router.use(authenticate, authorize(Role.ADMIN));

/**
 * @swagger
 * /coupons:
 *   post:
 *     tags: [Coupons]
 *     summary: Create coupon (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Coupon created
 */
router.post('/', validate({ body: createCouponDto }), couponController.create);

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: List all coupons (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coupons listed
 */
router.get('/', couponController.list);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     tags: [Coupons]
 *     summary: Update coupon (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coupon updated
 */
router.put('/:id', validate({ params: couponIdParamsDto, body: updateCouponDto }), couponController.update);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     tags: [Coupons]
 *     summary: Delete coupon (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coupon deleted
 */
router.delete('/:id', validate({ params: couponIdParamsDto }), couponController.delete);

export default router;
