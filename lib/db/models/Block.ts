import mongoose, { Schema, Model } from 'mongoose';

export interface IBlock {
    _id: string;
    blockerId: mongoose.Types.ObjectId;
    blockedId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const blockSchema = new Schema<IBlock>(
    {
        blockerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        blockedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
blockSchema.index({ blockerId: 1, createdAt: -1 });
blockSchema.index({ blockedId: 1 });

export const Block =
    (mongoose.models.Block as Model<IBlock>) ||
    mongoose.model<IBlock>('Block', blockSchema);
