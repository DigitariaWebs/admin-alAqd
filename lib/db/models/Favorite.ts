import mongoose, { Schema, Model } from 'mongoose';

export interface IFavorite {
    _id: string;
    fromUser: mongoose.Types.ObjectId;
    toUser: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
    {
        fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        toUser:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

favoriteSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
favoriteSchema.index({ fromUser: 1, createdAt: -1 });

export const Favorite =
    (mongoose.models.Favorite as Model<IFavorite>) ||
    mongoose.model<IFavorite>('Favorite', favoriteSchema);
