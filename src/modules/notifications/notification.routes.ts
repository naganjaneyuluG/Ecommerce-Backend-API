import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { notificationIdParamsDto, listNotificationsQueryDto } from './notification.dto';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notifications retrieved
 */
router.get('/', validate({ query: listNotificationsQueryDto }), notificationController.getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:id/read', validate({ params: notificationIdParamsDto }), notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', validate({ params: notificationIdParamsDto }), notificationController.deleteNotification);

export default router;
