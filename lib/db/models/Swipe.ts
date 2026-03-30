import mongoose, { Schema, Model } from 'mongoose';

export interface ISwipe {
    _id: string;
    fromUser: mongoose.Types.ObjectId;
    toUser: mongoose.Types.ObjectId;
    action: 'like' | 'pass';
    createdAt: Date;
    updatedAt: Date;
}

const swipeSchema = new Schema<ISwipe>(
    {
        fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, enum: ['like', 'pass'], required: true },
    },
    { timestamps: true }
);

// One swipe per user pair (upsert-safe), fast lookup by both directions
swipeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
swipeSchema.index({ toUser: 1, action: 1 });
swipeSchema.index({ fromUser: 1, createdAt: -1 });

export const Swipe =
    (mongoose.models.Swipe as Model<ISwipe>) ||
    mongoose.model<ISwipe>('Swipe', swipeSchema);
