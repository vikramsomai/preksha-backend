import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      ref: "Product",
      required: true,
      index: true
    },
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      maxlength: 100,
      default: ''
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000
    },
    images: {
      type: [String],
      default: []
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index for faster queries
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
