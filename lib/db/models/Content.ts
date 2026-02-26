import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
    title: string;
    slug: string;
    type: 'article' | 'video' | 'post' | 'page';
    content: string;
    excerpt?: string;
    featuredImage?: string;
    author: string;
    category?: string;
    tags?: string[];
    status: 'draft' | 'published' | 'pending';
    publishedAt?: Date;
    seoTitle?: string;
    seoDescription?: string;
    order?: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        type: { 
            type: String, 
            enum: ['article', 'video', 'post', 'page'], 
            required: true 
        },
        content: { type: String, required: true },
        excerpt: { type: String },
        featuredImage: { type: String },
        author: { type: String, required: true },
        category: { type: String },
        tags: [{ type: String }],
        status: { 
            type: String, 
            enum: ['draft', 'published', 'pending'], 
            default: 'draft' 
        },
        publishedAt: { type: Date },
        seoTitle: { type: String },
        seoDescription: { type: String },
        order: { type: Number, default: 0 },
        viewCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
ContentSchema.index({ type: 1, status: 1 });
ContentSchema.index({ slug: 1 });
ContentSchema.index({ category: 1 });

export const Content = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
