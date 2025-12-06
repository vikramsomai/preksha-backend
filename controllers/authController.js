import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation - minimum 8 chars, at least one letter and number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Validate required fields
    if (!firstname || !email || !password) {
      return res.status(400).json({ 
        error: "Missing required fields",
        details: "First name, email, and password are required" 
      });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: "Invalid email format",
        details: "Please provide a valid email address" 
      });
    }

    // Validate password strength
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Weak password",
        details: "Password must be at least 8 characters with at least one letter and one number" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        error: "Email already registered",
        details: "An account with this email already exists" 
      });
    }

    // Sanitize and normalize input
    const sanitizedData = {
      firstname: firstname.trim(),
      lastname: lastname?.trim() || '',
      email: email.toLowerCase().trim(),
      password
    };

    // Create a new user
    const user = await User.create(sanitizedData);

    // Don't return password in response
    const userResponse = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email
    };

    res.status(201).json({ 
      message: "User registered successfully", 
      user: userResponse 
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: "Email already registered",
        details: "An account with this email already exists" 
      });
    }
    
    res.status(500).json({ 
      error: "Registration failed", 
      details: "An unexpected error occurred. Please try again." 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Missing credentials",
        details: "Email and password are required" 
      });
    }

    // Find the user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Use constant-time comparison to prevent timing attacks
    if (!user) {
      // Still perform a dummy compare to prevent timing attacks
      await bcrypt.compare(password, '$2b$10$dummyhashforconstanttime');
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role || 'user'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Return user info (excluding password)
    const userInfo = {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role || 'user'
    };

    res.status(200).json({ 
      message: "Login successful", 
      token,
      user: userInfo
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      error: "Login failed", 
      details: "An unexpected error occurred. Please try again." 
    });
  }
};

// New: Password reset request
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ 
        message: "If an account exists with this email, a reset link will be sent." 
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // For now, just log it (in production, integrate email service)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({ 
      message: "If an account exists with this email, a reset link will be sent." 
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
};

// New: Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    // Validate password strength
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "Weak password",
        details: "Password must be at least 8 characters with at least one letter and one number" 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ error: "Invalid token" });
    }

    // Find and update user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// New: Change password (for authenticated users)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    // Validate password strength
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "Weak password",
        details: "Password must be at least 8 characters with at least one letter and one number" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
