const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load .env.local or .env
const envLocal = path.join(__dirname, '..', '.env.local');
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envLocal)) {
    require('dotenv').config({ path: envLocal });
} else {
    require('dotenv').config({ path: envFile });
}

const MONGODB_URI = process.env.MONGODB_URI || '';

const userSchema = new mongoose.Schema({
    phoneNumber: String,
    email: { type: String, sparse: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    password: String,
    provider: { type: String, enum: ['phone', 'google', 'apple', 'email'], default: 'email' },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'banned'], default: 'active' },
    isOnboarded: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not set in .env or .env.local');
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const existing = await User.findOne({ email: 'admin@admin.com' });
        if (existing) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        await User.create({
            email: 'admin@admin.com',
            name: 'Admin User',
            password: 'admin123',
            role: 'admin',
            status: 'active',
            provider: 'email',
            isEmailVerified: true,
            isOnboarded: true,
        });

        console.log('Admin user created: admin@admin.com / admin123');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seedAdmin();
