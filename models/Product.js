import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true, // Ensure productId is unique
      default: uuidv4, // Automatically generate a unique ID if not provided
    },
    productName: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 },
    sizes: { type: [String], default: [] },
    bestseller: { type: Boolean, default: false },
    imageUrls: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
