import express from "express";
import {
  validateCoupon,
  applyCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} from "../controllers/couponController.js";
import { authenticateToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public/User routes
router.post("/validate", validateCoupon);
router.post("/apply", applyCoupon);

// Admin routes
router.get("/", authenticateToken, isAdmin, getAllCoupons);
router.post("/", authenticateToken, isAdmin, createCoupon);
router.put("/:couponId", authenticateToken, isAdmin, updateCoupon);
router.delete("/:couponId", authenticateToken, isAdmin, deleteCoupon);
router.patch("/:couponId/toggle", authenticateToken, isAdmin, toggleCouponStatus);

export default router;
