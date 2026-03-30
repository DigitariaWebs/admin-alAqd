import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/conversations/:id/read
 * Marks all unread messages sent TO the current user as read.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
        }

        const match = await Match.findOne({
            _id: id,
            isActive: true,
            $or: [
                { user1: authResult.user.userId },
                { user2: authResult.user.userId },
            ],
        }).lean();

        if (!match) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const now = new Date();
        const result = await Message.updateMany(
            {
                conversationId: new mongoose.Types.ObjectId(id),
                receiverId: new mongoose.Types.ObjectId(authResult.user.userId),
                isRead: false,
            },
            { $set: { isRead: true, readAt: now } }
        );

        return NextResponse.json({
            success: true,
            markedRead: result.modifiedCount,
        });
    } catch (error) {
        console.error('Mark read error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
