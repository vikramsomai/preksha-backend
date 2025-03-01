import express from "express";
import { createProduct, getProducts } from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct); // Admin-only route for adding products
router.get("/", getProducts); // Fetch all products

export default router;
