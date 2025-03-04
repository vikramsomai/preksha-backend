import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    user: {
      userId: {
        type: String,
        ref: "User",
        required: true,
      },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    products: [
      {
        productId: {
          type: String,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        size: { type: String, required: true },
      },
    ],
    totalAmount: { type: Number, required: true }, // Calculated total amount of the order
    payment: {
      method: {
        type: String,
        enum: ["ESEWA", "KHALTI", "COD"],
        required: true,
      },
      transactionId: { type: String, unique: true }, // Transaction ID from the payment gateway (if applicable)
      status: {
        type: String,
        enum: ["PENDING", "COMPLETE", "FAILED", "REFUNDED"], // Example statuses
        default: "PENDING",
        required: true,
      },
    },
    shippingAddress: {
      address: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
      required: true,
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt fields
);

orderSchema.statics.getTopSellingProductByQuantity = async function () {
  const result = await this.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.productId",
          totalSold: {
            $sum: "$products.quantity",
          },
          productName: {
            $first: "$products.name",
          },
        },
      },
      {
        $sort: {
          totalSold: -1,
        },
      },
      {
        $limit: 1,
      },
  ]);

  return result.length ? result[0] : null;
};

const Order = mongoose.model("Order", orderSchema);
export default Order;
