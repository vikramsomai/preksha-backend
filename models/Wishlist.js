import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Ensure unique userId
wishlistSchema.index({ userId: 1 }, { unique: true });

// Method to add product to wishlist
wishlistSchema.methods.addProduct = async function(productId) {
    const exists = this.products.some(p => p.productId.toString() === productId.toString());
    if (!exists) {
        this.products.push({ productId });
        await this.save();
    }
    return this;
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = async function(productId) {
    this.products = this.products.filter(p => p.productId.toString() !== productId.toString());
    await this.save();
    return this;
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function(productId) {
    return this.products.some(p => p.productId.toString() === productId.toString());
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
