import mongoose, { Schema, Model } from 'mongoose';

export interface IReaction {
    _id: string;
    fromUser: mongoose.Types.ObjectId;
    toUser: mongoose.Types.ObjectId;
    emoji: string;
    message?: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
    {
        fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, required: true },
        message: String,
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

reactionSchema.index({ toUser: 1, isRead: 1 });
reactionSchema.index({ fromUser: 1, toUser: 1 });

export const Reaction =
    (mongoose.models.Reaction as Model<IReaction>) ||
    mongoose.model<IReaction>('Reaction', reactionSchema);
