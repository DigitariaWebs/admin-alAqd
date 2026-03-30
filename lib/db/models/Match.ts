import mongoose, { Schema, Model } from 'mongoose';

export interface IMatch {
    _id: string;
    user1: mongoose.Types.ObjectId;
    user2: mongoose.Types.ObjectId;
    matchType: 'like';
    isActive: boolean;
    deletedBy: mongoose.Types.ObjectId[];
    clearedAt: Map<string, Date>;
    lastMessage?: string;
    lastMessageAt?: Date;
    similarities?: string[];
    compatibility?: number;
    createdAt: Date;
    updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
    {
        // user1 and user2 are always stored in sorted order (smaller ID first)
        // to guarantee uniqueness regardless of which user triggers the match
        user1: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        user2: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        matchType: { type: String, default: 'like' },
        isActive: { type: Boolean, default: true },
        deletedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        clearedAt: { type: Map, of: Date, default: {} },
        lastMessage: String,
        lastMessageAt: Date,
        similarities: [String],
        compatibility: Number,
    },
    { timestamps: true }
);

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ user1: 1, createdAt: -1 });
matchSchema.index({ user2: 1, createdAt: -1 });
matchSchema.index({ isActive: 1 });

export const Match =
    (mongoose.models.Match as Model<IMatch>) ||
    mongoose.model<IMatch>('Match', matchSchema);
