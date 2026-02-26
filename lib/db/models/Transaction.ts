import mongoose, { Schema, Model } from 'mongoose';

export interface ITransaction {
    _id: string;
    transactionNumber: string;
    orderId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;

    type: 'credit' | 'debit';
    amount: number;
    currency: string;

    description: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';

    paymentMethod?: string;
    last4?: string;
    provider?: string;
    stripePaymentIntentId?: string;
    stripeSessionId?: string;

    metadata?: Record<string, unknown>;

    createdAt: Date;
    completedAt?: Date;
    failedAt?: Date;
}

interface ITransactionMethods {}

type TransactionModel = Model<ITransaction, {}, ITransactionMethods>;

const transactionSchema = new Schema<ITransaction, TransactionModel, ITransactionMethods>(
    {
        transactionNumber: { type: String, required: true, unique: true },
        orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        type: { type: String, enum: ['credit', 'debit'], required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },

        description: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'pending'
        },

        paymentMethod: String,
        last4: String,
        provider: String,
        stripePaymentIntentId: String,
        stripeSessionId: String,

        metadata: Schema.Types.Mixed,

        completedAt: Date,
        failedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction, TransactionModel>('Transaction', transactionSchema);
