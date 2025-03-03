import express from "express";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import connectDB from "./config/db.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { authenticateToken } from "./middlewares/authMiddleware.js";
import dotenv from "dotenv";
import otpRoute from "./routes/otpRoute.js";
import adminRoute from "./routes/adminRoute.js";
import orderRoutes from "./routes/orderRoute.js";
import categoryRoute from "./routes/categoryRoutes.js"
import User from "./models/User.js";
import {
  paymentStatus,
  EsewaInitiatePayment,
  codPayment,
} from "./controllers/esewa.controller.js";
const app = express();
dotenv.config();
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL, // Replace with your frontend's URL
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
const allowedOrigins = process.env.CLIENT_URL.split(",");

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // Allows all origins dynamically
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

import { fileURLToPath } from "url";

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", uploadRoutes);
app.use("/admin", adminRoute);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/order", orderRoutes);
app.use("/category",categoryRoute)
//routes
app.post("/initiate-payment", EsewaInitiatePayment);
app.post("/payment-status", paymentStatus);
app.post("/codPayment", codPayment);
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const obj = {
      userId: user.id,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      address: user.address,
      province: user.province,
      postalCode: user.postalCode,
      phoneNumber: user.phoneNumber,
    };
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
connectDB();
app.use("/api/otp", otpRoute); // Use OTP route
app.get("/", (req, res) => {
  res.json({
    hello: "hello",
  });
});
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
export default app;
