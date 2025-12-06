import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

// Admin credentials from environment variables (with fallback for development)
const getAdminCredentials = () => {
  return {
    username: process.env.ADMIN_EMAIL || "admin@prekshafashion.com",
    // In production, use a hashed password stored in env
    passwordHash: process.env.ADMIN_PASSWORD_HASH || null,
    // Only use plain password in development if hash not set
    password: process.env.ADMIN_PASSWORD || "admin123"
  };
};

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
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
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: "Access Denied - Admin role required" });
    }
    req.admin = verified;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired", expired: true });
    }
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Admin Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const adminCreds = getAdminCredentials();

    // Check username
    if (username.toLowerCase() !== adminCreds.username.toLowerCase()) {
      // Perform dummy hash compare to prevent timing attacks
      await bcrypt.compare(password, '$2b$10$dummyhashforconstanttime');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    let isPasswordValid = false;
    
    if (adminCreds.passwordHash) {
      // Use hashed password from environment (recommended for production)
      isPasswordValid = await bcrypt.compare(password, adminCreds.passwordHash);
    } else {
      // Fallback to plain password comparison (development only)
      isPasswordValid = password === adminCreds.password;
      
      // Log warning in production
      if (process.env.NODE_ENV === 'production') {
        console.warn('WARNING: Using plain text admin password. Set ADMIN_PASSWORD_HASH for production.');
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { 
        role: "admin",
        username: adminCreds.username,
        iat: Math.floor(Date.now() / 1000)
      }, 
      process.env.SECRET_KEY, 
      { expiresIn: "8h" } // Shorter expiry for admin tokens
    );

    return res.json({ 
      message: "Login successful", 
      token,
      expiresIn: 8 * 60 * 60 // 8 hours in seconds
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// Verify admin token (for frontend to check if still valid)
router.get("/verify", verifyAdminToken, (req, res) => {
  res.json({ 
    valid: true, 
    admin: {
      username: req.admin.username,
      role: req.admin.role
    }
  });
});

// Admin logout (optional - mainly for logging purposes)
router.post("/logout", verifyAdminToken, (req, res) => {
  // In a more complex system, you might blacklist the token here
  console.log(`Admin ${req.admin.username} logged out at ${new Date().toISOString()}`);
  res.json({ message: "Logged out successfully" });
});

export default router;
