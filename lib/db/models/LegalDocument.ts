import mongoose, { Schema, Document } from 'mongoose';

export type LegalDocumentType = 'privacy' | 'terms';
export type LegalDocumentLanguage = 'en' | 'fr' | 'ar' | 'es';

export interface ILegalDocument extends Document {
    type: LegalDocumentType;
    language: LegalDocumentLanguage;
    title: string;
    content: string;
    version: number;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LegalDocumentSchema = new Schema<ILegalDocument>(
    {
        type: {
            type: String,
            enum: ['privacy', 'terms'],
            required: true,
        },
        language: {
            type: String,
            enum: ['en', 'fr', 'ar', 'es'],
            required: true,
        },
        title: { type: String, required: true },
        content: { type: String, required: true },
        version: { type: Number, default: 1 },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
    },
);

// One document per (type, language) pair
LegalDocumentSchema.index({ type: 1, language: 1 }, { unique: true });

export const LegalDocument =
    mongoose.models.LegalDocument ||
    mongoose.model<ILegalDocument>('LegalDocument', LegalDocumentSchema);
