import express from "express";
import jwt from "jsonwebtoken";
import { register, login } from "../controllers/authController.js";
import User from "../models/User.js";

const router = express.Router();
const { JWT_SECRET } = process.env;

// Routes
router.post("/register", register);
router.post("/login", login);

// Middleware to Protect Routes
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Protected Route
router.get("/api/auth/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected data accessed", user: req.user });
});

// Update a user by their userId
router.post("/update", async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;

    // Validate that userId is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Update the user by userId
    const updatedUser = await User.findByIdAndUpdate(
      userId, // The ID of the user to update
      { $set: updateData }, // The fields to update
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
