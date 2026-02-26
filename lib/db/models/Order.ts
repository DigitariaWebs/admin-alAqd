import mongoose, { Schema, Model } from 'mongoose';

export interface IOrder {
    _id: string;
    orderNumber: string;
    userId: mongoose.Types.ObjectId;
    customerName: string;
    customerEmail: string;

    items: {
        name: string;
        description?: string;
        price: number;
        quantity: number;
        total: number;
    }[];

    subtotal: number;
    tax: number;
    total: number;

    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';

    payment: {
        method: string;
        last4?: string;
        provider: string;
        stripePaymentIntentId?: string;
        stripeSessionId?: string;
    };

    stripeCustomerId?: string;
    subscriptionId?: string;
    planId?: string;

    metadata?: Record<string, unknown>;

    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    failedAt?: Date;
    refundedAt?: Date;
}

interface IOrderMethods {}

type OrderModel = Model<IOrder, {}, IOrderMethods>;

const orderItemSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    total: { type: Number, required: true },
}, { _id: false });

const orderSchema = new Schema<IOrder, OrderModel, IOrderMethods>(
    {
        orderNumber: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        customerName: { type: String, required: true },
        customerEmail: { type: String },

        items: [orderItemSchema],

        subtotal: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: true },

        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },

        payment: {
            method: { type: String, default: 'card' },
            last4: String,
            provider: { type: String, default: 'stripe' },
            stripePaymentIntentId: String,
            stripeSessionId: String,
        },

        stripeCustomerId: String,
        subscriptionId: String,
        planId: String,

        metadata: Schema.Types.Mixed,

        completedAt: Date,
        failedAt: Date,
        refundedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model<IOrder, OrderModel>('Order', orderSchema);
