import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Get top selling product by quantity
export async function getTopSellingProductByQuantity(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 1;
    
    const ordersCount = await Order.countDocuments();
    if (ordersCount === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    const result = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalSold: { $sum: "$products.quantity" },
          productName: { $first: "$products.name" },
          productImage: { $first: "$products.image" },
          productPrice: { $first: "$products.price" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "No top-selling product found." });
    }

    res.json(limit === 1 ? result[0] : result);
  } catch (error) {
    console.error("Error fetching top selling product:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get orders by status
export async function getOrdersByStatus(req, res) {
  try {
    const { status } = req.params;
    const validStatuses = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status", 
        validStatuses 
      });
    }

    const orders = await Order.find({ status })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error("Error fetching orders by status:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get order statistics
export async function getOrderStats(req, res) {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const paymentMethodCounts = await Order.aggregate([
      { $group: { _id: "$payment.method", count: { $sum: 1 } } },
    ]);

    res.json({
      overview: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      byPaymentMethod: paymentMethodCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ error: error.message });
  }
}

// Update order status
export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status", 
        validStatuses 
      });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
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

    res.json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get user orders
export async function getUserOrders(req, res) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const orders = await Order.find({ "user.userId": userId })
      .sort({ createdAt: -1 });

    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get single order details
export async function getOrderById(req, res) {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get recent orders (for admin dashboard)
export async function getRecentOrders(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ orders, count: orders.length });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get pending orders count
export async function getPendingOrdersCount(req, res) {
  try {
    const count = await Order.countDocuments({ 
      status: { $in: ['Order Placed', 'Processing'] } 
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching pending orders count:", error);
    res.status(500).json({ error: error.message });
  }
}
