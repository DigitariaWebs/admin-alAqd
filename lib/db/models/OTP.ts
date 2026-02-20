import mongoose, { Schema, Model } from 'mongoose';

export interface IOTP {
    _id: string;
    phoneNumber: string;
    code: string;
    expiresAt: Date;
    attempts: number;
    verified: boolean;
    createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
    {
        phoneNumber: { type: String, required: true },
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
// TTL index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = (mongoose.models.OTP as Model<IOTP>) || mongoose.model<IOTP>('OTP', otpSchema);
