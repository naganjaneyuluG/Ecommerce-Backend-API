import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { upload } from '@shared/middlewares/upload.middleware';
import { Role } from '@shared/types/enums';
import { updateProfileDto, addAddressDto, updateAddressDto, listUsersQueryDto, userIdParamsDto, addressIdParamsDto } from './user.dto';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/me', validate({ body: updateProfileDto }), userController.updateProfile);

/**
 * @swagger
 * /users/me/avatar:
 *   put:
 *     tags: [Users]
 *     summary: Upload user avatar
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.put('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

/**
 * @swagger
 * /users/me/addresses:
 *   post:
 *     tags: [Users]
 *     summary: Add a new address
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Address added successfully
 */
router.post('/me/addresses', validate({ body: addAddressDto }), userController.addAddress);

/**
 * @swagger
 * /users/me/addresses/{addressId}:
 *   put:
 *     tags: [Users]
 *     summary: Update an address
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address updated successfully
 */
router.put(
  '/me/addresses/:addressId',
  validate({ params: addressIdParamsDto, body: updateAddressDto }),
  userController.updateAddress
);

/**
 * @swagger
 * /users/me/addresses/{addressId}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete an address
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 */
router.delete(
  '/me/addresses/:addressId',
  validate({ params: addressIdParamsDto }),
  userController.deleteAddress
);

// Admin-only routes
/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get(
  '/',
  authorize(Role.ADMIN),
  validate({ query: listUsersQueryDto }),
  userController.listUsers
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (Admin only)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 */
router.get('/:id', authorize(Role.ADMIN), validate({ params: userIdParamsDto }), userController.getUserById);

export default router;
