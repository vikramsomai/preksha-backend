import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstname: { 
      type: String, 
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastname: { 
      type: String, 
      default: '',
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    phone: { 
      type: String,
      trim: true,
      default: ''
    },
    address: { 
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      trim: true,
      default: 'Nepal'
    },
    postalCode: { 
      type: String,
      trim: true,
      default: ''
    },
    province: { 
      type: String,
      trim: true,
      default: ''
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date
    },
    refreshToken: { 
      type: String 
    },
    // Keep for backward compatibility
    isAdmin: { 
      type: Boolean, 
      default: false 
    },
    // Backward compatibility alias for phone
    phoneNumber: {
      type: String,
      get: function() { return this.phone; },
      set: function(v) { this.phone = v; }
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstname} ${this.lastname}`.trim();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  // Only hash if not already hashed
  if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
    return next();
  }
  
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return this.save();
};

// Index for common queries
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
