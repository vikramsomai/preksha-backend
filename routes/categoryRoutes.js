import express from "express";
const router = express.Router();
import Category from "../models/category.js";
import SubCategory from "../models/subcategory.js";
router.post("/add-category", async (req, res) => {
  try {
    const { category } = req.body;

    const user = await Category.create({ category });
    res.status(201).json({ message: " Category added successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
});

router.post("/add-subCategory", async (req, res) => {
  try {
    const { category } = req.body;

    const user = await SubCategory.create({ category });
    res.status(201).json({ message: " Category added successfully", user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const product = await Category.findByIdAndDelete(id); // Find product by ID
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "product unable to delelte" });
    }
  });

router.get("/all", async (req, res) => {
  try {
    const category = await Category.find(); // Fetch all products
    res.status(200).json(category); // Respond with the data
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
});
router.get("/subcategory", async (req, res) => {
  try {
    const category = await SubCategory.find(); // Fetch all products
    res.status(200).json(category); // Respond with the data
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
});
router.delete("/sub/delete/:id", async (req, res) => {
    const { id } = req.params;
  
    try {
      const product = await SubCategory.findByIdAndDelete(id); // Find product by ID
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
