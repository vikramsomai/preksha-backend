import mongoose from "mongoose";

const shippingConfigSchema = new mongoose.Schema(
  {
    province: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'Koshi Province',
        'Madhesh Province',
        'Bagmati Province',
        'Gandaki Province',
        'Lumbini Province',
        'Karnali Province',
        'Sudurpashchim Province'
      ]
    },
    shippingCharge: {
      type: Number,
      required: true,
      min: 0
    },
    freeShippingThreshold: {
      type: Number,
      default: null // Free shipping if order amount >= this value
    },
    estimatedDays: {
      min: { type: Number, default: 3 },
      max: { type: Number, default: 7 }
    },
    isDeliveryAvailable: {
      type: Boolean,
      default: true
    },
    codAvailable: {
      type: Boolean,
      default: true
    },
    // Major cities in the province for faster delivery
    majorCities: [{
      name: String,
      shippingCharge: Number,
      estimatedDays: {
        min: Number,
        max: Number
      }
    }]
  },
  { timestamps: true }
);

const ShippingConfig = mongoose.model("ShippingConfig", shippingConfigSchema);

export default ShippingConfig;
