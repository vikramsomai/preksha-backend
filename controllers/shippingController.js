import ShippingConfig from "../models/ShippingConfig.js";

// Nepal's 7 provinces default shipping configuration
const defaultShippingData = [
  {
    province: 'Bagmati Province',
    shippingCharge: 100,
    freeShippingThreshold: 2000,
    estimatedDays: { min: 1, max: 3 },
    isDeliveryAvailable: true,
    codAvailable: true,
    majorCities: [
      { name: 'Kathmandu', shippingCharge: 80, estimatedDays: { min: 1, max: 2 } },
      { name: 'Lalitpur', shippingCharge: 80, estimatedDays: { min: 1, max: 2 } },
      { name: 'Bhaktapur', shippingCharge: 100, estimatedDays: { min: 1, max: 2 } }
    ]
  },
  {
    province: 'Gandaki Province',
    shippingCharge: 150,
    freeShippingThreshold: 3000,
    estimatedDays: { min: 2, max: 4 },
    isDeliveryAvailable: true,
    codAvailable: true,
    majorCities: [
      { name: 'Pokhara', shippingCharge: 120, estimatedDays: { min: 2, max: 3 } }
    ]
  },
  {
    province: 'Lumbini Province',
    shippingCharge: 180,
    freeShippingThreshold: 3500,
    estimatedDays: { min: 3, max: 5 },
    isDeliveryAvailable: true,
    codAvailable: true,
    majorCities: [
      { name: 'Butwal', shippingCharge: 150, estimatedDays: { min: 2, max: 4 } },
      { name: 'Bhairahawa', shippingCharge: 150, estimatedDays: { min: 2, max: 4 } }
    ]
  },
  {
    province: 'Koshi Province',
    shippingCharge: 200,
    freeShippingThreshold: 4000,
    estimatedDays: { min: 3, max: 5 },
    isDeliveryAvailable: true,
    codAvailable: true,
    majorCities: [
      { name: 'Biratnagar', shippingCharge: 150, estimatedDays: { min: 2, max: 4 } },
      { name: 'Dharan', shippingCharge: 180, estimatedDays: { min: 3, max: 4 } }
    ]
  },
  {
    province: 'Madhesh Province',
    shippingCharge: 180,
    freeShippingThreshold: 3500,
    estimatedDays: { min: 3, max: 5 },
    isDeliveryAvailable: true,
    codAvailable: true,
    majorCities: [
      { name: 'Janakpur', shippingCharge: 150, estimatedDays: { min: 2, max: 4 } },
      { name: 'Birgunj', shippingCharge: 150, estimatedDays: { min: 2, max: 4 } }
    ]
  },
  {
    province: 'Karnali Province',
    shippingCharge: 300,
    freeShippingThreshold: 5000,
    estimatedDays: { min: 5, max: 10 },
    isDeliveryAvailable: true,
    codAvailable: false,
    majorCities: [
      { name: 'Surkhet', shippingCharge: 250, estimatedDays: { min: 4, max: 7 } }
    ]
  },
  {
    province: 'Sudurpashchim Province',
    shippingCharge: 300,
    freeShippingThreshold: 5000,
    estimatedDays: { min: 5, max: 10 },
    isDeliveryAvailable: true,
    codAvailable: false,
    majorCities: [
      { name: 'Dhangadhi', shippingCharge: 250, estimatedDays: { min: 4, max: 7 } }
    ]
  }
];

// Initialize default shipping config
export const initializeShippingConfig = async (req, res) => {
  try {
    const existingConfig = await ShippingConfig.countDocuments();
    if (existingConfig > 0) {
      return res.status(400).json({ message: 'Shipping configuration already exists' });
    }

    await ShippingConfig.insertMany(defaultShippingData);
    res.status(201).json({ message: 'Shipping configuration initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shipping charge for a province
export const getShippingCharge = async (req, res) => {
  try {
    const { province, city, orderAmount } = req.query;

    const config = await ShippingConfig.findOne({ province });
    if (!config) {
      return res.status(404).json({ message: 'Shipping not available for this province' });
    }

    if (!config.isDeliveryAvailable) {
      return res.status(400).json({ message: 'Delivery not available in this province currently' });
    }

    let shippingCharge = config.shippingCharge;
    let estimatedDays = config.estimatedDays;

    // Check if city-specific pricing exists
    if (city) {
      const cityConfig = config.majorCities.find(
        c => c.name.toLowerCase() === city.toLowerCase()
      );
      if (cityConfig) {
        shippingCharge = cityConfig.shippingCharge;
        estimatedDays = cityConfig.estimatedDays;
      }
    }

    // Check for free shipping
    const amount = parseFloat(orderAmount) || 0;
    const isFreeShipping = config.freeShippingThreshold && amount >= config.freeShippingThreshold;

    res.status(200).json({
      province: config.province,
      shippingCharge: isFreeShipping ? 0 : shippingCharge,
      originalCharge: shippingCharge,
      isFreeShipping,
      freeShippingThreshold: config.freeShippingThreshold,
      amountForFreeShipping: isFreeShipping ? 0 : Math.max(0, config.freeShippingThreshold - amount),
      estimatedDays,
      codAvailable: config.codAvailable
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all shipping configurations
export const getAllShippingConfig = async (req, res) => {
  try {
    const configs = await ShippingConfig.find().sort({ shippingCharge: 1 });
    res.status(200).json(configs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update shipping config for a province
export const updateShippingConfig = async (req, res) => {
  try {
    const { province } = req.params;
    const updates = req.body;

    const config = await ShippingConfig.findOneAndUpdate(
      { province },
      updates,
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Province configuration not found' });
    }

    res.status(200).json({ message: 'Shipping config updated successfully', config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check delivery availability
export const checkDeliveryAvailability = async (req, res) => {
  try {
    const { province } = req.query;

    const config = await ShippingConfig.findOne({ province });
    if (!config) {
      return res.status(200).json({ 
        available: false, 
        message: 'Delivery not available in this area' 
      });
    }

    res.status(200).json({
      available: config.isDeliveryAvailable,
      codAvailable: config.codAvailable,
      estimatedDays: config.estimatedDays,
      message: config.isDeliveryAvailable 
        ? `Delivery available (${config.estimatedDays.min}-${config.estimatedDays.max} days)` 
        : 'Delivery temporarily unavailable in this area'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
