import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    subject: {
      type: String,
      required: true,
      enum: ['general', 'order', 'product', 'return', 'payment', 'other'],
      default: 'general'
    },
    orderId: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'closed'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

export default ContactMessage;
