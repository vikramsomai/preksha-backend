import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id); // Correct way
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndDelete(req.params.id); // Find product by ID
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "product unable to delelte" });
  }
});
export default router;
