import express from "express";
import {
  getShippingCharge,
  getAllShippingConfig,
  updateShippingConfig,
  initializeShippingConfig,
  checkDeliveryAvailability
} from "../controllers/shippingController.js";
import { authenticateToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/charge", getShippingCharge);
router.get("/availability", checkDeliveryAvailability);
router.get("/", getAllShippingConfig);

// Admin routes
router.post("/initialize", authenticateToken, isAdmin, initializeShippingConfig);
router.put("/:province", authenticateToken, isAdmin, updateShippingConfig);

export default router;
