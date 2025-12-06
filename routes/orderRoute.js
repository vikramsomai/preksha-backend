import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import jwt from "jsonwebtoken";
import { 
  getTopSellingProductByQuantity,
  getOrderStats,
  getOrdersByStatus,
  getRecentOrders,
  getPendingOrdersCount
} from "../controllers/orderController.js";

const router = express.Router();

// Admin verification middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(403).json({ message: "Access Denied" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.admin = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Get all orders (admin only)
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = status ? { status } : {};
    
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Get order statistics (admin only)
router.get("/stats", verifyAdmin, getOrderStats);

// Get recent orders (admin only)
router.get("/recent", verifyAdmin, getRecentOrders);

// Get pending orders count (admin only)
router.get("/pending-count", verifyAdmin, getPendingOrdersCount);

// Get orders by status (admin only)
router.get("/status/:status", verifyAdmin, getOrdersByStatus);

// Get top selling products
router.get("/top/top-selling", getTopSellingProductByQuantity);

// Get user orders
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  // Prevent this route from matching special endpoints
  if (['all', 'stats', 'recent', 'pending-count', 'top'].includes(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const orders = await Order.find({
      "user.userId": userId,
      $or: [
        { "payment.status": "COMPLETE" },
        { "payment.method": "COD", "payment.status": "PENDING" }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({ orders, count: orders.length });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update order status (admin only)
router.put("/:orderId/status", verifyAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "Order Placed",
    "Packed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ 
      error: "Invalid status provided",
      allowedStatuses 
    });
  }

  try {
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // If cancelling, restore product stock
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.products) {
        const product = await Product.findOne({ productId: item.productId });
        if (product) {
          product.qty += item.quantity;
          await product.save();
        }
      }
    }

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get order for printing/invoice
router.get("/print/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
