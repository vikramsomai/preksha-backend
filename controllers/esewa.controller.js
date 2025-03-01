import Order from "../models/Order.js";
import Product from "../models/Product.js";

import { EsewaPaymentGateway, EsewaCheckStatus } from "esewajs"; //we install our package hehe

const EsewaInitiatePayment = async (req, res) => {
  const { amount, productId, order } = req.body; // Data from frontend
  console.log("Initiating payment with:", { amount, productId, order });

  try {
    const reqPayment = await EsewaPaymentGateway(
      amount,
      0,
      0,
      0,
      productId,
      process.env.MERCHANT_ID,
      process.env.SECRET,
      process.env.SUCCESS_URL,
      process.env.FAILURE_URL,
      process.env.ESEWAPAYMENT_URL,
      undefined,
      undefined
    );

    if (!reqPayment) {
      return res.status(400).json({ message: "Error sending data to eSewa." });
    }

    if (reqPayment.status === 200) {
      // Save transaction details in the database
      const orders = new Order({
        orderId: productId,
        user: {
          userId: order.users.userId, // Make sure to provide this value
          firstName: order.users.firstName, // Make sure to provide this value
          lastName: order.users.lastName, // Make sure to provide this value
          email: order.users.email, // Make sure to provide this value
          phoneNumber: order.users.phoneNumber,
        },
        products: order.products,
        totalAmount: order.totalAmount,
        payment: {
          method: order.payment.method,
          transactionId: order.payment.transactionId,
          status: order.payment.status,
        },
        shippingAddress: order.shippingAddress,
        status: order.status,
      });

      await orders.save();
      await Promise.all(
        order.products.map(async (item) => {
          // Lookup the product using your custom 'productId' field
          const product = await Product.findOne({ productId: item.productId });
          if (product) {
            // Check if there is sufficient quantity before deducting
            if (product.qty >= item.quantity) {
              product.qty -= item.quantity;
              await product.save();
            } else {
              // Optionally handle insufficient inventory here (rollback or notify)
              console.warn(
                `Insufficient inventory for product ${item.productId}. Available: ${product.qty}, Requested: ${item.quantity}`
              );
            }
          } else {
            console.warn(`Product ${item.productId} not found.`);
          }
        })
      );

      return res.status(200).json({
        message: "Payment initiated successfully.",
        product_id: productId,
        url: reqPayment.request.res.responseUrl, // Redirect URL
      });
    }
  } catch (error) {
    console.error("Error initiating payment:", error.message);
    return res.status(500).json({
      message: "Failed to initiate payment.",
      error: error.message,
    });
  }
};
const codPayment = async (req, res) => {
  const { productId,order } = req.body; // Data from frontend
  const orders = new Order({
    orderId: productId,
    user: {
      userId: order.users.userId, // Make sure to provide this value
      firstName: order.users.firstName, // Make sure to provide this value
      lastName: order.users.lastName, // Make sure to provide this value
      email: order.users.email, // Make sure to provide this value
      phoneNumber: order.users.phoneNumber,
    },
    products: order.products,
    totalAmount: order.totalAmount,
    payment: {
      method: order.payment.method,
      transactionId: order.payment.transactionId,
      status: order.payment.status,
    },
    shippingAddress: order.shippingAddress,
    status: order.status,
  });
  try {
    await orders.save();
    await Promise.all(
      order.products.map(async (item) => {
        // Lookup the product using your custom 'productId' field
        const product = await Product.findOne({ productId: item.productId });
        if (product) {
          // Check if there is sufficient quantity before deducting
          if (product.qty >= item.quantity) {
            product.qty -= item.quantity;
            await product.save();
          } else {
            // Optionally handle insufficient inventory here (rollback or notify)
            console.warn(
              `Insufficient inventory for product ${item.productId}. Available: ${product.qty}, Requested: ${item.quantity}`
            );
          }
        } else {
          console.warn(`Product ${item.productId} not found.`);
        }
      })
    );
    return res.status(200).json({ message: "successfully saved" });
  } catch (err) {
    return res.status(500).json({ err: "failed" });
  }
};

const paymentStatus = async (req, res) => {
  console.log("product id set", req.body);
  const orderId = req.body.product_id; // Data from frontend

  try {
    // Find the transaction in the database
    const order = await Order.findOne({ orderId });

    if (!order) {
      console.error("Transaction not found for product ID:", orderId);
      return res.status(404).json({ message: "Transaction not found." });
    }

    // Call eSewa to check the payment status
    const paymentStatusCheck = await EsewaCheckStatus(
      order.totalAmount,
      order.orderId,
      process.env.MERCHANT_ID,
      process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    console.log("Payment status response:", paymentStatusCheck.data);

    if (paymentStatusCheck.status === 200) {
      // Update transaction status based on response
      order.payment.status =
        paymentStatusCheck.data.status === "COMPLETE" ? "COMPLETE" : "FAILED";

      await order.save();
      console.log("Transaction updated:", transaction);

      return res.status(200).json({
        message: "Transaction status updated successfully.",
        status: order.payment.status,
      });
    } else {
      console.error("Payment status check failed.");
      
      return res.status(400).json({
        message: "Failed to verify payment status.",
        error: paymentStatusCheck.data,
      });
    }
  } catch (error) {
    console.error("Error verifying payment status:", error.message);
    return res.status(500).json({
      message: "Server error while verifying payment status.",
      error: error.message,
    });
  }
};

export { EsewaInitiatePayment, paymentStatus, codPayment };
