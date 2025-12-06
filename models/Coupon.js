import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: null // No limit if null
    },
    validFrom: {
      type: Date,
      required: true
    },
    validUntil: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: null // Unlimited if null
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    applicableCategories: {
      type: [String],
      default: [] // Empty means all categories
    },
    // Nepal-specific
    applicableProvinces: {
      type: [String],
      default: [] // Empty means all provinces
    }
  },
  { timestamps: true }
);

// Check if coupon is valid
couponSchema.methods.isValid = function(orderAmount, province) {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, message: 'Coupon is not yet active' };
  if (now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount is NPR ${this.minOrderAmount}` };
  }
  if (this.applicableProvinces.length > 0 && !this.applicableProvinces.includes(province)) {
    return { valid: false, message: 'Coupon not valid for your province' };
  }
  
  return { valid: true };
};

// Calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.discountType === 'PERCENTAGE') {
    discount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    discount = this.discountValue;
  }
  
  return Math.min(discount, orderAmount);
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
