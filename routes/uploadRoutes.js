import express from "express";
import multer from "multer";
import Product from "../models/Product.js";

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files in the uploads folder
  },
  filename: (req, file, cb) => {
    // Replace spaces with underscores and sanitize the filename
    const sanitizedFilename = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + sanitizedFilename);
  },
});
const upload = multer({ storage });

// Image Upload Route
router.post("/upload", upload.array("images", 5), (req, res) => {
  const imagePaths = req.files.map((file) => file.path);
  res.json({ imagePaths });
});

// Save Product Details Route
router.post("/product", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: "Product saved successfully", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch All Products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products
    res.status(200).json(products); // Respond with the data
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Fetch Product by ID
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id); // Find product by ID
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});



// Update Product by ID
router.put("/products/:id", upload.array("images"), async (req, res) => {
  try {
    const productId = req.params.id;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Fetch the existing product
    const existingProduct = await Product.findOne({ productId });
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Updated data from request body
    const data = req.body;

    // Handle new images
    const newImageUrls =
      req.files?.map((file) => `uploads/${file.filename}`) || [];

    // If `imageUrls` are sent in the body, use them; otherwise, merge old and new images
    const finalImageUrls =
      data.imageUrls && data.imageUrls.length > 0
        ? data.imageUrls
        : [...existingProduct.imageUrls, ...newImageUrls];

    // Update the product in the database
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      { ...data, imageUrls: finalImageUrls },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error.stack);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Backend API to Get Product Details by IDs
router.post("/get-cart-products", async (req, res) => {
  const { productIds } = req.body;

  try {
    // Fetch the products by their IDs
    const products = await Product.find({ _id: { $in: productIds } }).select(
      "_id productName price qty"
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching cart products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

export default router;
