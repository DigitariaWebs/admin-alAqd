import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    slug: string;
    description?: string;
    type: 'article' | 'video' | 'post' | 'page' | 'all';
    parentId?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
        type: { 
            type: String, 
            enum: ['article', 'video', 'post', 'page', 'all'], 
            default: 'all' 
        },
        parentId: { type: String },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
CategorySchema.index({ slug: 1 });
CategorySchema.index({ type: 1 });
CategorySchema.index({ parentId: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
