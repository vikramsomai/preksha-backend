import FlashSale from '../models/FlashSale.js';
import Product from '../models/Product.js';

// Get all active flash sales
export const getActiveFlashSales = async (req, res) => {
    try {
        const now = new Date();
        
        const flashSales = await FlashSale.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        })
        .populate({
            path: 'products.productId',
            select: 'productName imageUrls category subcategory stock'
        })
        .sort({ priority: -1 });
        
        res.json({
            success: true,
            flashSales
        });
    } catch (error) {
        console.error('Get flash sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flash sales'
        });
    }
};

// Get upcoming flash sales (for preview)
export const getUpcomingFlashSales = async (req, res) => {
    try {
        const now = new Date();
        
        const flashSales = await FlashSale.find({
            isActive: true,
            startDate: { $gt: now }
        })
        .populate({
            path: 'products.productId',
            select: 'productName imageUrls'
        })
        .sort({ startDate: 1 })
        .limit(5);
        
        res.json({
            success: true,
            flashSales
        });
    } catch (error) {
        console.error('Get upcoming flash sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming flash sales'
        });
    }
};

// Get single flash sale by ID
export const getFlashSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const flashSale = await FlashSale.findById(id)
            .populate({
                path: 'products.productId',
                select: 'productName imageUrls category subcategory stock description'
            });
        
        if (!flashSale) {
            return res.status(404).json({
                success: false,
                message: 'Flash sale not found'
            });
        }
        
        res.json({
            success: true,
            flashSale
        });
    } catch (error) {
        console.error('Get flash sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flash sale'
        });
    }
};

// Check if product is in any active flash sale
export const getProductFlashSale = async (req, res) => {
    try {
        const { productId } = req.params;
        const now = new Date();
        
        const flashSale = await FlashSale.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            'products.productId': productId
        });
        
        if (!flashSale) {
            return res.json({
                success: true,
                inFlashSale: false
            });
        }
        
        const productInfo = flashSale.products.find(
            p => p.productId.toString() === productId
        );
        
        res.json({
            success: true,
            inFlashSale: true,
            flashSale: {
                id: flashSale._id,
                name: flashSale.name,
                endDate: flashSale.endDate,
                salePrice: productInfo.salePrice,
                originalPrice: productInfo.originalPrice,
                discountPercentage: flashSale.discountPercentage,
                stockLimit: productInfo.stockLimit,
                soldCount: productInfo.soldCount
            }
        });
    } catch (error) {
        console.error('Get product flash sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check flash sale'
        });
    }
};

// ADMIN: Create flash sale
export const createFlashSale = async (req, res) => {
    try {
        const {
            name,
            description,
            startDate,
            endDate,
            discountPercentage,
            products,
            bannerImage,
            priority
        } = req.body;
        
        // Validate dates
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Calculate sale prices for products
        const processedProducts = await Promise.all(products.map(async (p) => {
            const product = await Product.findById(p.productId);
            if (!product) {
                throw new Error(`Product ${p.productId} not found`);
            }
            
            const salePrice = Math.round(product.price * (1 - discountPercentage / 100));
            
            return {
                productId: p.productId,
                salePrice,
                originalPrice: product.price,
                stockLimit: p.stockLimit || null
            };
        }));
        
        const flashSale = await FlashSale.create({
            name,
            description,
            startDate,
            endDate,
            discountPercentage,
            products: processedProducts,
            bannerImage,
            priority: priority || 0
        });
        
        res.status(201).json({
            success: true,
            message: 'Flash sale created successfully',
            flashSale
        });
    } catch (error) {
        console.error('Create flash sale error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create flash sale'
        });
    }
};

// ADMIN: Update flash sale
export const updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // If updating products with new discount, recalculate prices
        if (updates.products && updates.discountPercentage) {
            updates.products = await Promise.all(updates.products.map(async (p) => {
                const product = await Product.findById(p.productId);
                if (product) {
                    return {
                        ...p,
                        salePrice: Math.round(product.price * (1 - updates.discountPercentage / 100)),
                        originalPrice: product.price
                    };
                }
                return p;
            }));
        }
        
        const flashSale = await FlashSale.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!flashSale) {
            return res.status(404).json({
                success: false,
                message: 'Flash sale not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Flash sale updated successfully',
            flashSale
        });
    } catch (error) {
        console.error('Update flash sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flash sale'
        });
    }
};

// ADMIN: Delete flash sale
export const deleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        
        const flashSale = await FlashSale.findByIdAndDelete(id);
        
        if (!flashSale) {
            return res.status(404).json({
                success: false,
                message: 'Flash sale not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Flash sale deleted successfully'
        });
    } catch (error) {
        console.error('Delete flash sale error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete flash sale'
        });
    }
};

// ADMIN: Get all flash sales
export const getAllFlashSales = async (req, res) => {
    try {
        const flashSales = await FlashSale.find()
            .populate({
                path: 'products.productId',
                select: 'productName imageUrls price'
            })
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            flashSales
        });
    } catch (error) {
        console.error('Get all flash sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flash sales'
        });
    }
};

// Increment sold count when product is purchased from flash sale
export const incrementSoldCount = async (productId) => {
    try {
        const now = new Date();
        
        await FlashSale.updateOne(
            {
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now },
                'products.productId': productId
            },
            {
                $inc: { 'products.$.soldCount': 1 }
            }
        );
    } catch (error) {
        console.error('Increment sold count error:', error);
    }
};
