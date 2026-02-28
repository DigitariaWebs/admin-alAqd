import mongoose, { Schema } from 'mongoose';

export interface ITicket {
    _id: string;
    ticketNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'pending' | 'closed';
    category: string;
    messages: Array<{
        id: string;
        sender: 'user' | 'admin';
        content: string;
        timestamp: Date;
        attachments?: string[];
    }>;
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date;
}

const ticketSchema = new Schema<ITicket>({
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['open', 'pending', 'closed'],
        default: 'open',
    },
    category: {
        type: String,
        default: 'general',
    },
    messages: [{
        id: {
            type: String,
            required: true,
        },
        sender: {
            type: String,
            enum: ['user', 'admin'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
        },
        attachments: [{
            type: String,
        }],
    }],
    assignedTo: {
        type: String,
    },
    closedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Indexes for efficient querying
ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ userId: 1 });
ticketSchema.index({ category: 1 });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', ticketSchema);
