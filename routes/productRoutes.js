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
    console.log(err);
    res
      .status(500)
      .json({ message: "Error fetching product", error: err.message });
  }
});

export default router;
