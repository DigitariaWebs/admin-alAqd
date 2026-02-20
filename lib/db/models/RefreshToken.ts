import mongoose, { Schema, Model } from 'mongoose';

export interface IRefreshToken {
    _id: string;
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        token: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: true },
        isRevoked: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = (mongoose.models.RefreshToken as Model<IRefreshToken>) || 
    mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
