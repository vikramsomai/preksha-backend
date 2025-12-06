import Order from "../models/Order.js";
import Product from "../models/Product.js";

import { EsewaPaymentGateway, EsewaCheckStatus } from "esewajs";

// Helper function to update product stock
const updateProductStock = async (products, restore = false) => {
  const results = [];
  
  for (const item of products) {
    try {
      const product = await Product.findOne({ productId: item.productId });
      if (!product) {
        console.warn(`Product ${item.productId} not found.`);
        results.push({ productId: item.productId, success: false, error: 'Product not found' });
        continue;
      }

      if (restore) {
        product.qty += item.quantity;
        await product.save();
        results.push({ productId: item.productId, success: true, action: 'restored' });
      } else {
        if (product.qty >= item.quantity) {
          product.qty -= item.quantity;
          await product.save();
          results.push({ productId: item.productId, success: true, action: 'deducted' });
        } else {
          console.warn(`Insufficient stock for product ${item.productId}. Available: ${product.qty}, Requested: ${item.quantity}`);
          results.push({ productId: item.productId, success: false, error: 'Insufficient stock' });
        }
      }
    } catch (error) {
      console.error(`Error updating stock for ${item.productId}:`, error.message);
      results.push({ productId: item.productId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Validate order data before processing
const validateOrderData = (order) => {
  const errors = [];
  
  if (!order.users?.userId) errors.push('User ID is required');
  if (!order.users?.firstName) errors.push('First name is required');
  if (!order.users?.email) errors.push('Email is required');
  if (!order.users?.phoneNumber) errors.push('Phone number is required');
  if (!order.products || order.products.length === 0) errors.push('Products are required');
  if (!order.shippingAddress?.address) errors.push('Shipping address is required');
  if (!order.shippingAddress?.province) errors.push('Province is required');
  if (!order.totalAmount || order.totalAmount <= 0) errors.push('Valid total amount is required');
  
  return errors;
};

const EsewaInitiatePayment = async (req, res) => {
  const { amount, productId, order } = req.body;

  // Validate input
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount." });
  }

  if (!productId) {
    return res.status(400).json({ message: "Product ID (transaction ID) is required." });
  }

  const validationErrors = validateOrderData(order);
  if (validationErrors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors: validationErrors });
  }

  try {
    // Check if order with same ID already exists
    const existingOrder = await Order.findOne({ orderId: productId });
    if (existingOrder) {
      return res.status(400).json({ message: "Order with this transaction ID already exists." });
    }

    // Verify stock availability before proceeding
    for (const item of order.products) {
      const product = await Product.findOne({ productId: item.productId });
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found.` });
      }
      if (product.qty < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Available: ${product.qty}, Requested: ${item.quantity}` 
        });
      }
    }

    const reqPayment = await EsewaPaymentGateway(
      amount,
      0, // tax
      0, // product service charge
      0, // product delivery charge
      productId,
      process.env.MERCHANT_ID,
      process.env.SECRET,
      process.env.SUCCESS_URL,
      process.env.FAILURE_URL,
      process.env.ESEWAPAYMENT_URL
    );

    if (!reqPayment || reqPayment.status !== 200) {
      return res.status(400).json({ message: "Error initiating eSewa payment." });
    }

    // Create order with PENDING status
    const newOrder = new Order({
      orderId: productId,
      user: {
        userId: order.users.userId,
        firstName: order.users.firstName,
        lastName: order.users.lastName || '',
        email: order.users.email,
        phoneNumber: order.users.phoneNumber,
      },
      products: order.products,
      totalAmount: order.totalAmount,
      payment: {
        method: 'ESEWA',
        transactionId: productId,
        status: 'PENDING',
      },
      shippingAddress: order.shippingAddress,
      status: 'Order Placed',
    });

    await newOrder.save();
    
    // Deduct stock
    await updateProductStock(order.products, false);

    res.status(200).json({
      message: "Payment initiated successfully.",
      product_id: productId,
      url: reqPayment.request.res.responseUrl,
    });

    // Set timeout to clean up pending orders (2 minutes)
    setTimeout(async () => {
      try {
        const pendingOrder = await Order.findOne({
          orderId: productId,
          "payment.status": "PENDING",
        });

        if (pendingOrder) {
          console.log(`Order ${productId} still pending after 2 minutes. Cleaning up...`);
          await updateProductStock(order.products, true);
          await Order.deleteOne({ orderId: productId });
          console.log(`Order ${productId} removed and stock restored.`);
        }
      } catch (error) {
        console.error("Error in cleanup timeout:", error.message);
      }
    }, 120000); // 2 minutes

  } catch (error) {
    console.error("Payment initiation error:", error);
    return res.status(500).json({
      message: "Failed to initiate payment.",
      error: error.message,
    });
  }
};

const codPayment = async (req, res) => {
  const { productId, order } = req.body;

  // Validate input
  if (!productId) {
    return res.status(400).json({ message: "Transaction ID is required." });
  }

  const validationErrors = validateOrderData(order);
  if (validationErrors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors: validationErrors });
  }

  try {
    // Check if order with same ID already exists
    const existingOrder = await Order.findOne({ orderId: productId });
    if (existingOrder) {
      return res.status(400).json({ message: "Order with this transaction ID already exists." });
    }

    // Verify stock availability
    for (const item of order.products) {
      const product = await Product.findOne({ productId: item.productId });
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found.` });
      }
      if (product.qty < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Available: ${product.qty}, Requested: ${item.quantity}` 
        });
      }
    }

    // Create order
    const newOrder = new Order({
      orderId: productId,
      user: {
        userId: order.users.userId,
        firstName: order.users.firstName,
        lastName: order.users.lastName || '',
        email: order.users.email,
        phoneNumber: order.users.phoneNumber,
      },
      products: order.products,
      totalAmount: order.totalAmount,
      payment: {
        method: 'COD',
        transactionId: productId,
        status: 'PENDING',
      },
      shippingAddress: order.shippingAddress,
      status: 'Order Placed',
    });

    await newOrder.save();

    // Deduct stock
    const stockResults = await updateProductStock(order.products, false);
    const failedItems = stockResults.filter(r => !r.success);
    
    if (failedItems.length > 0) {
      console.warn('Some stock updates failed:', failedItems);
    }

    return res.status(200).json({ 
      message: "Order placed successfully",
      orderId: productId
    });

  } catch (err) {
    console.error("COD order error:", err);
    return res.status(500).json({ message: "Failed to place order", error: err.message });
  }
};

const paymentStatus = async (req, res) => {
  const orderId = req.body.product_id;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required." });
  }

  try {
    const order = await Order.findOne({ orderId });

    if (!order) {
      console.error("Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found." });
    }

    // If already completed, return success
    if (order.payment.status === 'COMPLETE') {
      return res.status(200).json({
        message: "Payment already verified.",
        status: order.payment.status,
      });
    }

    // Call eSewa to check payment status
    const paymentStatusCheck = await EsewaCheckStatus(
      order.totalAmount,
      order.orderId,
      process.env.MERCHANT_ID,
      process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    console.log("eSewa status response:", paymentStatusCheck?.data);

    if (paymentStatusCheck && paymentStatusCheck.status === 200) {
      const esewaStatus = paymentStatusCheck.data?.status;
      
      if (esewaStatus === "COMPLETE") {
        order.payment.status = "COMPLETE";
        await order.save();

        return res.status(200).json({
          message: "Payment verified successfully.",
          status: "COMPLETE",
        });
      } else {
        order.payment.status = "FAILED";
        await order.save();

        // Restore stock on failed payment
        await updateProductStock(order.products, true);

        return res.status(200).json({
          message: "Payment verification failed.",
          status: "FAILED",
        });
      }
    } else {
      return res.status(400).json({
        message: "Failed to verify payment status with eSewa.",
        error: paymentStatusCheck?.data,
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    return res.status(500).json({
      message: "Server error while verifying payment.",
      error: error.message,
    });
  }
};

export { EsewaInitiatePayment, paymentStatus, codPayment };
