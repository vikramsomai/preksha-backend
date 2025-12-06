import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 1,
        max: 90
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        salePrice: {
            type: Number,
            required: true
        },
        originalPrice: {
            type: Number,
            required: true
        },
        stockLimit: {
            type: Number,
            default: null // null means unlimited
        },
        soldCount: {
            type: Number,
            default: 0
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    bannerImage: {
        type: String,
        default: null
    },
    priority: {
        type: Number,
        default: 0 // Higher number = higher priority
    }
}, { timestamps: true });

// Virtual to check if sale is currently live
flashSaleSchema.virtual('isLive').get(function() {
    const now = new Date();
    return this.isActive && this.startDate <= now && this.endDate >= now;
});

// Virtual for time remaining
flashSaleSchema.virtual('timeRemaining').get(function() {
    const now = new Date();
    if (this.endDate <= now) return 0;
    return this.endDate - now;
});

// Index for efficient queries
flashSaleSchema.index({ startDate: 1, endDate: 1, isActive: 1 });
flashSaleSchema.index({ 'products.productId': 1 });

// Enable virtuals in JSON
flashSaleSchema.set('toJSON', { virtuals: true });
flashSaleSchema.set('toObject', { virtuals: true });

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);

export default FlashSale;
