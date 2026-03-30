import mongoose, { Schema, Model } from 'mongoose';

export interface IOTP {
    _id: string;
    phoneNumber?: string;
    email?: string;
    type: 'phone' | 'email';
    code: string;
    expiresAt: Date;
    attempts: number;
    verified: boolean;
    createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
    {
        phoneNumber: { type: String },
        email: { type: String },
        type: { type: String, enum: ['phone', 'email'], default: 'phone' },
        code: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        verified: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// Indexes
otpSchema.index({ phoneNumber: 1 });
otpSchema.index({ email: 1 });
// TTL index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.OTP) {
    mongoose.deleteModel('OTP');
}

export const OTP = (mongoose.models.OTP as Model<IOTP>) || mongoose.model<IOTP>('OTP', otpSchema);
