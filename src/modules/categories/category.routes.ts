import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { Role } from '@shared/types/enums';
import { createCategoryDto, updateCategoryDto, categorySlugParamsDto, categoryIdParamsDto } from './category.dto';

const router = Router();
const categoryController = new CategoryController();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories (tree structure)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', categoryController.getAll);

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category retrieved
 */
router.get('/:slug', validate({ params: categorySlugParamsDto }), categoryController.getBySlug);

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create category (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', authenticate, authorize(Role.ADMIN), validate({ body: createCategoryDto }), categoryController.create);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update category (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/:id', authenticate, authorize(Role.ADMIN), validate({ params: categoryIdParamsDto, body: updateCategoryDto }), categoryController.update);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete('/:id', authenticate, authorize(Role.ADMIN), validate({ params: categoryIdParamsDto }), categoryController.delete);

export default router;
