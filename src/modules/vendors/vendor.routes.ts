import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticate } from '@shared/middlewares/auth.middleware';
import { authorize } from '@shared/middlewares/rbac.middleware';
import { validate } from '@shared/middlewares/validate.middleware';
import { Role } from '@shared/types/enums';
import { vendorApplyDto, updateVendorDto, vendorIdParamsDto } from './vendor.dto';

const router = Router();
const vendorController = new VendorController();

router.use(authenticate);

/**
 * @swagger
 * /vendors/apply:
 *   post:
 *     tags: [Vendors]
 *     summary: Apply to become a vendor
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Application submitted
 */
router.post('/apply', validate({ body: vendorApplyDto }), vendorController.apply);

/**
 * @swagger
 * /vendors/me:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor profile
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Vendor profile retrieved
 */
router.get('/me', authorize(Role.VENDOR, Role.ADMIN), vendorController.getProfile);

/**
 * @swagger
 * /vendors/me:
 *   put:
 *     tags: [Vendors]
 *     summary: Update vendor profile
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', authorize(Role.VENDOR, Role.ADMIN), validate({ body: updateVendorDto }), vendorController.updateProfile);

/**
 * @swagger
 * /vendors/me/products:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor's products
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Products retrieved
 */
router.get('/me/products', authorize(Role.VENDOR, Role.ADMIN), vendorController.getProducts);

/**
 * @swagger
 * /vendors/me/analytics:
 *   get:
 *     tags: [Vendors]
 *     summary: Get vendor sales analytics
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Analytics retrieved
 */
router.get('/me/analytics', authorize(Role.VENDOR, Role.ADMIN), vendorController.getAnalytics);

// Admin routes
/**
 * @swagger
 * /vendors:
 *   get:
 *     tags: [Vendors]
 *     summary: List all vendors (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Vendors listed
 */
router.get('/', authorize(Role.ADMIN), vendorController.listVendors);

/**
 * @swagger
 * /vendors/{id}/approve:
 *   put:
 *     tags: [Vendors]
 *     summary: Approve vendor (Admin)
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Vendor approved
 */
router.put('/:id/approve', authorize(Role.ADMIN), validate({ params: vendorIdParamsDto }), vendorController.approve);

export default router;
