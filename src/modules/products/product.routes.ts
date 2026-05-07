import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate, optionalAuth } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { upload } from '@shared/middlewares/upload.middleware';
import { Role } from '@shared/types/enums';
import { createProductDto, updateProductDto, listProductsQueryDto, productSlugParamsDto, productIdParamsDto } from './product.dto';

const router = Router();
const productController = new ProductController();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products with search, filters, and pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search query
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: minRating
 *         schema: { type: number }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [price, avgRating, createdAt, name] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get('/', optionalAuth, validate({ query: listProductsQueryDto }), productController.getProducts);

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product retrieved
 *       404:
 *         description: Product not found
 */
router.get('/:slug', optionalAuth, validate({ params: productSlugParamsDto }), productController.getProductBySlug);

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (Vendor/Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
  '/',
  authenticate,
  authorize(Role.VENDOR, Role.ADMIN),
  validate({ body: createProductDto }),
  productController.createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (Vendor/Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.VENDOR, Role.ADMIN),
  validate({ params: productIdParamsDto, body: updateProductDto }),
  productController.updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (Vendor/Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.VENDOR, Role.ADMIN),
  validate({ params: productIdParamsDto }),
  productController.deleteProduct
);

/**
 * @swagger
 * /products/{id}/images:
 *   post:
 *     tags: [Products]
 *     summary: Upload product images (Vendor/Admin)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post(
  '/:id/images',
  authenticate,
  authorize(Role.VENDOR, Role.ADMIN),
  validate({ params: productIdParamsDto }),
  upload.array('images', 10),
  productController.uploadImages
);

export default router;
