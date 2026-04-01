import mongoose, { Schema, Model } from 'mongoose';

export type MessageContentType = 'text' | 'emoji' | 'image' | 'call_invite';

export interface IMessage {
    _id: string;
    conversationId: mongoose.Types.ObjectId; // equals Match._id
    senderId: mongoose.Types.ObjectId;
    receiverId: mongoose.Types.ObjectId;
    content: string;
    contentType: MessageContentType;
    isRead: boolean;
    readAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversationId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
        senderId:       { type: Schema.Types.ObjectId, ref: 'User',  required: true },
        receiverId:     { type: Schema.Types.ObjectId, ref: 'User',  required: true },
        content:        { type: String, required: true, maxlength: 2000 },
        contentType:    { type: String, enum: ['text', 'emoji', 'image', 'call_invite'], default: 'text' },
        isRead:         { type: Boolean, default: false },
        readAt:         Date,
        isDeleted:      { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Fast per-conversation message list
messageSchema.index({ conversationId: 1, createdAt: -1 });
// Fast unread count per conversation + recipient
messageSchema.index({ conversationId: 1, receiverId: 1, isRead: 1 });
// Fast global unread count for a user
messageSchema.index({ receiverId: 1, isRead: 1 });

export const Message =
    (mongoose.models.Message as Model<IMessage>) ||
    mongoose.model<IMessage>('Message', messageSchema);
