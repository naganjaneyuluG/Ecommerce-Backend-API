import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate, optionalAuth } from '@shared/middlewares/auth.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { createReviewDto, updateReviewDto, reviewProductParamsDto, reviewIdParamsDto, listReviewsQueryDto } from './review.dto';

const router = Router();
const reviewController = new ReviewController();

/**
 * @swagger
 * /reviews/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reviews retrieved
 */
router.get('/:productId', optionalAuth, validate({ params: reviewProductParamsDto, query: listReviewsQueryDto }), reviewController.getProductReviews);

/**
 * @swagger
 * /reviews/{productId}:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review (verified purchase)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post('/:productId', authenticate, validate({ params: reviewProductParamsDto, body: createReviewDto }), reviewController.createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update own review
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Review updated
 */
router.put('/:id', authenticate, validate({ params: reviewIdParamsDto, body: updateReviewDto }), reviewController.updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete review
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/:id', authenticate, validate({ params: reviewIdParamsDto }), reviewController.deleteReview);

export default router;
