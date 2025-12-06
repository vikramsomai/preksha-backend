import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { 
  register, 
  login, 
  requestPasswordReset, 
  resetPassword,
  changePassword 
} from "../controllers/authController.js";
import User from "../models/User.js";

const router = express.Router();
const { JWT_SECRET } = process.env;

// Middleware to Protect Routes
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(403).json({ message: "Access Denied - No token provided" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(403).json({ message: "Access Denied - Invalid token format" });
  }

  const token = parts[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired", expired: true });
    }
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Public Routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Protected Routes
router.post("/change-password", verifyToken, changePassword);

// Protected Route for checking auth status
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ 
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile (protected)
router.put("/update", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from token, not from body
    const { firstname, lastname, email, phone, address, city, country } = req.body;

    // Validate required fields
    if (!firstname || !email) {
      return res.status(400).json({ message: "First name and email are required." });
    }

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(), 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(409).json({ message: "Email is already in use by another account." });
      }
    }

    // Build update object with only allowed fields
    const updateData = {
      firstname: firstname?.trim(),
      lastname: lastname?.trim() || '',
      email: email?.toLowerCase().trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      city: city?.trim() || '',
      country: country?.trim() || ''
    };

    // Remove undefined/null values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ 
      message: "Profile updated successfully", 
      user: {
        id: updatedUser._id,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        country: updatedUser.country
      }
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// Legacy update route (kept for backward compatibility, but requires auth)
router.post("/update", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstname, lastname, email, phone, address, city, country } = req.body;

    const updateData = {};
    if (firstname) updateData.firstname = firstname.trim();
    if (lastname) updateData.lastname = lastname.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (city) updateData.city = city.trim();
    if (country) updateData.country = country.trim();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ 
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
