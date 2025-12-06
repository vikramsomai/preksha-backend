import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    user: {
      userId: {
        type: String,
        ref: "User",
        required: true,
        index: true
      },
      firstName: { type: String, required: true },
      lastName: { type: String, default: '' },
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
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, default: '' },
        size: { type: String, default: '' },
      },
    ],
    totalAmount: { 
      type: Number, 
      required: true,
      min: 0 
    },
    payment: {
      method: {
        type: String,
        enum: ["ESEWA", "KHALTI", "COD"],
        required: true,
      },
      transactionId: { 
        type: String,
        index: true
        // Removed unique: true to handle COD orders better
      },
      status: {
        type: String,
        enum: ["PENDING", "COMPLETE", "FAILED", "REFUNDED"],
        default: "PENDING",
        required: true,
      },
      paidAt: { type: Date },
    },
    shippingAddress: {
      address: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Processing",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Order Placed",
      required: true,
      index: true
    },
    notes: { type: String, default: '' },
    cancelReason: { type: String, default: '' },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for order age in days
orderSchema.virtual('orderAgeDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save hook to set paidAt when payment is complete
orderSchema.pre('save', function(next) {
  if (this.isModified('payment.status') && this.payment.status === 'COMPLETE' && !this.payment.paidAt) {
    this.payment.paidAt = new Date();
  }
  next();
});

// Static method for top selling products
orderSchema.statics.getTopSellingProductByQuantity = async function (limit = 1) {
  const result = await this.aggregate([
    { $match: { status: { $ne: 'Cancelled' } } },
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

  return limit === 1 ? (result.length ? result[0] : null) : result;
};

// Static method for revenue by date range
orderSchema.statics.getRevenueByDateRange = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'Cancelled' },
        'payment.status': 'COMPLETE'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    }
  ]);
  
  return result.length ? result[0] : { totalRevenue: 0, orderCount: 0 };
};

// Index for common queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.status': 1, status: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
