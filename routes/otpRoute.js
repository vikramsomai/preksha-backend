import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Temporary store for OTPs (in-memory)
const otpStore = {};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your preferred email service
  auth: {
    user: "example18b074@gmail.com",
    pass: "zokhrnkrjbtdqzvf",
  },
});

// Generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Route: Send OTP
router.post("/send", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    console.error("Email is required");
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = generateOTP();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
      <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Preskha fashion</a>
    </div>
    <p style="font-size:1.1em">Hi,</p>
    <p>Thank you for choosing Your Brand. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
    <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
    <p style="font-size:0.9em;">Regards,<br />Your Brand</p>
    <hr style="border:none;border-top:1px solid #eee" />
    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
      <p>Preksha fashion</p>
      <p>Kathmandu</p>
      <p>Nepal</p>
    </div>
  </div>
</div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: `OTP sent successfully to ${email}` });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Route: Verify OTP
router.post("/verify", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    console.error("Email and OTP are required");
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const storedOtpData = otpStore[email];

  if (
    storedOtpData &&
    storedOtpData.otp === otp &&
    Date.now() < storedOtpData.expiresAt
  ) {
    delete otpStore[email];
    res.status(200).json({ message: "OTP verified successfully" });
  } else {
    console.error("Invalid or expired OTP for:", email);
    res.status(400).json({ message: "Invalid or expired OTP" });
  }
});

export default router;
