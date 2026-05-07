import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { Role } from '@shared/types/enums';
import { placeOrderDto, updateOrderStatusDto, cancelOrderDto, orderIdParamsDto, listOrdersQueryDto } from './order.dto';

const router = Router();
const orderController = new OrderController();

router.use(authenticate);

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Place a new order
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Order placed successfully
 */
router.post('/', validate({ body: placeOrderDto }), orderController.placeOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get order history
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Orders retrieved
 */
router.get('/', validate({ query: listOrdersQueryDto }), orderController.getOrderHistory);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order details
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Order details retrieved
 */
router.get('/:id', validate({ params: orderIdParamsDto }), orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.put('/:id/cancel', validate({ params: orderIdParamsDto, body: cancelOrderDto }), orderController.cancelOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status (Admin/Vendor)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
  '/:id/status',
  authorize(Role.ADMIN, Role.VENDOR),
  validate({ params: orderIdParamsDto, body: updateOrderStatusDto }),
  orderController.updateOrderStatus
);

export default router;
