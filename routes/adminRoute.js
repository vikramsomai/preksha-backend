import express from "express";
import jwt from "jsonwebtoken";
const router = express.Router();

const ADMIN_CREDENTIALS = {
  username: "admin@gmail.com",
  password: "admin123",
};

// Login Route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if credentials match
  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    // Generate JWT Token
    const token = jwt.sign({ role: "admin" }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.json({ message: "Login successful", token });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});
export default router;
