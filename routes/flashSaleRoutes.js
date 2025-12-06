import express from 'express';
import * as flashSaleController from '../controllers/flashSaleController.js';
import { authenticateToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/active', flashSaleController.getActiveFlashSales);
router.get('/upcoming', flashSaleController.getUpcomingFlashSales);
router.get('/product/:productId', flashSaleController.getProductFlashSale);
router.get('/:id', flashSaleController.getFlashSaleById);

// Admin routes
router.get('/', authenticateToken, isAdmin, flashSaleController.getAllFlashSales);
router.post('/', authenticateToken, isAdmin, flashSaleController.createFlashSale);
router.put('/:id', authenticateToken, isAdmin, flashSaleController.updateFlashSale);
router.delete('/:id', authenticateToken, isAdmin, flashSaleController.deleteFlashSale);

export default router;
