import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { Role } from '@shared/types/enums';
import { updateInventoryDto, inventoryProductParamsDto } from './inventory.dto';

const router = Router();
const inventoryController = new InventoryController();

router.use(authenticate);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     tags: [Inventory]
 *     summary: Get low stock items (Admin/Vendor)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Low stock items retrieved
 */
router.get('/low-stock', authorize(Role.ADMIN, Role.VENDOR), inventoryController.getLowStock);

/**
 * @swagger
 * /inventory/{productId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get stock info for a product
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Stock info retrieved
 */
router.get('/:productId', validate({ params: inventoryProductParamsDto }), inventoryController.getStock);

/**
 * @swagger
 * /inventory/{productId}:
 *   put:
 *     tags: [Inventory]
 *     summary: Update stock (Admin/Vendor)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Stock updated
 */
router.put(
  '/:productId',
  authorize(Role.ADMIN, Role.VENDOR),
  validate({ params: inventoryProductParamsDto, body: updateInventoryDto }),
  inventoryController.updateStock
);

export default router;
