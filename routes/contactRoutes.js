import express from "express";
import {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  submitContactForm,
  getAllContactMessages,
  updateContactStatus,
  getMessageStats
} from "../controllers/contactController.js";
import { authenticateToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/newsletter/subscribe", subscribe);
router.post("/newsletter/unsubscribe", unsubscribe);
router.post("/contact", submitContactForm);

// Admin routes
router.get("/newsletter/subscribers", authenticateToken, isAdmin, getAllSubscribers);
router.get("/messages", authenticateToken, isAdmin, getAllContactMessages);
router.patch("/messages/:messageId", authenticateToken, isAdmin, updateContactStatus);
router.get("/messages/stats", authenticateToken, isAdmin, getMessageStats);

export default router;
