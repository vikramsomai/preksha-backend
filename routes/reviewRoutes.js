import express from "express";
import {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview,
  markHelpful,
  getUserReviews
} from "../controllers/reviewController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes (require authentication)
router.post("/", authenticateToken, addReview);
router.put("/:reviewId", authenticateToken, updateReview);
router.delete("/:reviewId", authenticateToken, deleteReview);
router.post("/:reviewId/helpful", markHelpful);
router.get("/user/:userId", authenticateToken, getUserReviews);

export default router;
