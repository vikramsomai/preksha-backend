import express from "express";
import Order from "../models/Order.js";
const router = express.Router();
import { getTopSellingProductByQuantity } from "../controllers/orderController.js";

router.get("/all", async (req, res) => {
  try {
    const order = await Order.find(); // Fetch all products
    res.status(200).json(order); // Respond with the data
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch orders where the userId matches
    const orders = await Order.find({ "user.userId": userId });

    if (orders.length === 0) {
      return res
        .status(404)
        .json({ message: "No orders found for this user." });
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.put("/:orderId/status", async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  // Define allowed statuses (must match your model enum)
  const allowedStatuses = [
    "Order Placed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  // Check if provided status is allowed
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status provided" });
  }

  try {
    // Find the order by ID
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId },
      { status, updatedAt: Date.now() },
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/print/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.find({ orderId: orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If found, send back the order data
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/top/top-selling", getTopSellingProductByQuantity);
export default router;
