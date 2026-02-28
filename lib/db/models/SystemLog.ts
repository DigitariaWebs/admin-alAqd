import mongoose, { Schema } from 'mongoose';

export interface ISystemLog {
    _id: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    category: string;
    context?: Record<string, any>;
    user?: string;
    ip?: string;
    createdAt: Date;
}

const systemLogSchema = new Schema<ISystemLog>({
    level: {
        type: String,
        enum: ['info', 'warning', 'error', 'debug'],
        default: 'info',
    },
    message: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: 'system',
    },
    context: {
        type: Schema.Types.Mixed,
    },
    user: {
        type: String,
    },
    ip: {
        type: String,
    },
}, {
    timestamps: true,
});

// Indexes for efficient querying
systemLogSchema.index({ level: 1, createdAt: -1 });
systemLogSchema.index({ category: 1, createdAt: -1 });
systemLogSchema.index({ user: 1, createdAt: -1 });
systemLogSchema.index({ ip: 1, createdAt: -1 });

export const SystemLog = mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', systemLogSchema);
