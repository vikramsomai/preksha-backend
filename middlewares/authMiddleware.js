import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized, invalid token" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized, no token" });
  }
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader); // Debugging line

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Token is not valid" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token
  console.log("Extracted Token:", token); // Debugging line

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token Verification Error:", err); // Debugging line
      return res.status(403).json({ message: "Token is not valid" });
    }
    req.user = decoded;
    next();
  });
};
