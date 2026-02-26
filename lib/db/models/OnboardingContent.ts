import mongoose, { Schema, Document } from 'mongoose';

export interface IOnboardingContent extends Document {
    section: string;
    key: string;
    type: 'personality' | 'faith' | 'interests' | 'guidelines' | 'tips';
    items: {
        value: string;
        label: string;
        category?: string;
    }[];
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const OnboardingContentSchema = new Schema<IOnboardingContent>(
    {
        section: { type: String, required: true },
        key: { type: String, required: true, unique: true },
        type: { 
            type: String, 
            enum: ['personality', 'faith', 'interests', 'guidelines', 'tips'], 
            required: true 
        },
        items: [{
            value: { type: String, required: true },
            label: { type: String, required: true },
            category: { type: String },
        }],
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
OnboardingContentSchema.index({ key: 1 });
OnboardingContentSchema.index({ type: 1 });

export const OnboardingContent = mongoose.models.OnboardingContent || mongoose.model<IOnboardingContent>('OnboardingContent', OnboardingContentSchema);
