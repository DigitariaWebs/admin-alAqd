import mongoose, { Schema } from 'mongoose';

export interface INotification {
    _id: string;
    // Notification content
    title: string;
    body: string;
    data?: Record<string, unknown>;
    
    // Targeting
    type: 'informational' | 'promotional' | 'alert';  // ✅ MODIFIÉ
    targetAudience?: 'all' | 'premium' | 'inactive';   // ✅ MODIFIÉ
    targetGender?: 'male' | 'female';
    targetUserIds?: string[];
    
    // Scheduling
    isScheduled: boolean;
    scheduledFor?: Date;
    sentAt?: Date;
    
    // Delivery status
    status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
    
    // Delivery stats
    deliveryStats?: {
        totalRecipients: number;
        sent: number;
        delivered: number;
        failed: number;
        opened?: number;
        clicked?: number;
    };
    
    // Metadata
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        type: {
            type: String,
            enum: ['informational', 'promotional', 'alert'],  // ✅ MODIFIÉ
            default: 'informational',                          // ✅ MODIFIÉ
        },
        targetAudience: {
            type: String,
            enum: ['all', 'premium', 'inactive'],              // ✅ MODIFIÉ
            default: 'all',                                     // ✅ AJOUTÉ
        },
        targetGender: {
            type: String,
            enum: ['male', 'female'],
        },
        targetUserIds: [{
            type: String,
        }],
        isScheduled: {
            type: Boolean,
            default: false,
        },
        scheduledFor: {
            type: Date,
        },
        sentAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'sent', 'failed', 'cancelled'],
            default: 'draft',
        },
        deliveryStats: {
            totalRecipients: { type: Number, default: 0 },
            sent: { type: Number, default: 0 },
            delivered: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            opened: { type: Number, default: 0 },
            clicked: { type: Number, default: 0 },
        },
        createdBy: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ isScheduled: 1, scheduledFor: 1 });
notificationSchema.index({ type: 1, status: 1 });

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);