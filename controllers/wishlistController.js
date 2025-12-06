import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// Get user's wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        
        let wishlist = await Wishlist.findOne({ userId })
            .populate({
                path: 'products.productId',
                select: 'productName price imageUrls category subcategory stock isActive'
            });
        
        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, products: [] });
        }
        
        // Filter out any null products (deleted products)
        const validProducts = wishlist.products.filter(p => p.productId !== null);
        
        res.json({
            success: true,
            wishlist: validProducts,
            count: validProducts.length
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch wishlist' 
        });
    }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID is required' 
            });
        }
        
        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }
        
        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }
        
        // Check if already in wishlist
        const exists = wishlist.products.some(
            p => p.productId.toString() === productId
        );
        
        if (exists) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product already in wishlist' 
            });
        }
        
        wishlist.products.push({ productId });
        await wishlist.save();
        
        res.json({
            success: true,
            message: 'Product added to wishlist',
            count: wishlist.products.length
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add to wishlist' 
        });
    }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ 
                success: false, 
                message: 'Wishlist not found' 
            });
        }
        
        const initialLength = wishlist.products.length;
        wishlist.products = wishlist.products.filter(
            p => p.productId.toString() !== productId
        );
        
        if (wishlist.products.length === initialLength) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found in wishlist' 
            });
        }
        
        await wishlist.save();
        
        res.json({
            success: true,
            message: 'Product removed from wishlist',
            count: wishlist.products.length
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remove from wishlist' 
        });
    }
};

// Check if product is in wishlist
export const checkWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        
        const wishlist = await Wishlist.findOne({ userId });
        const isInWishlist = wishlist ? 
            wishlist.products.some(p => p.productId.toString() === productId) : 
            false;
        
        res.json({
            success: true,
            isInWishlist
        });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to check wishlist' 
        });
    }
};

// Clear entire wishlist
export const clearWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            wishlist.products = [];
            await wishlist.save();
        }
        
        res.json({
            success: true,
            message: 'Wishlist cleared'
        });
    } catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to clear wishlist' 
        });
    }
};

// Move all wishlist items to cart (utility endpoint)
export const moveAllToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const wishlist = await Wishlist.findOne({ userId })
            .populate('products.productId');
        
        if (!wishlist || wishlist.products.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Wishlist is empty' 
            });
        }
        
        // Return product details for frontend to add to cart
        const products = wishlist.products
            .filter(p => p.productId && p.productId.isActive && p.productId.stock > 0)
            .map(p => ({
                productId: p.productId._id,
                productName: p.productId.productName,
                price: p.productId.price,
                imageUrl: p.productId.imageUrls[0]
            }));
        
        res.json({
            success: true,
            products,
            message: `${products.length} items ready to add to cart`
        });
    } catch (error) {
        console.error('Move to cart error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to move items to cart' 
        });
    }
};
