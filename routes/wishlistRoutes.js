import express from 'express';
import * as wishlistController from '../controllers/wishlistController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Add product to wishlist
router.post('/add', wishlistController.addToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.checkWishlist);

// Clear entire wishlist
router.delete('/clear', wishlistController.clearWishlist);

// Move all items to cart
router.get('/move-to-cart', wishlistController.moveAllToCart);

export default router;
