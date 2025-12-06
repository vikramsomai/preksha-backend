import Coupon from "../models/Coupon.js";

// Validate and apply coupon
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, province } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Coupon not found' });
    }

    const validation = coupon.isValid(orderAmount, province);
    if (!validation.valid) {
      return res.status(400).json(validation);
    }

    const discount = coupon.calculateDiscount(orderAmount);

    res.status(200).json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalAmount: orderAmount - discount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply coupon (increase usage count)
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon applied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Create coupon
export const createCoupon = async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxDiscountAmount, validFrom, validUntil,
      usageLimit, applicableCategories, applicableProvinces
    } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      applicableCategories: applicableCategories || [],
      applicableProvinces: applicableProvinces || []
    });

    await coupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByIdAndUpdate(couponId, updates, { new: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon updated successfully', coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete coupon
export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Toggle coupon status
export const toggleCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({ 
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: coupon.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
