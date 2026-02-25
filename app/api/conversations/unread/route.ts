import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { Message } from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/conversations/unread
 * Returns the total number of unread messages across all conversations.
 * Used to drive the tab bar badge.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const count = await Message.countDocuments({
            receiverId: new mongoose.Types.ObjectId(authResult.user.userId),
            isRead: false,
            isDeleted: false,
        });

        return NextResponse.json({ success: true, unreadCount: count });
    } catch (error) {
        console.error('Unread count error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
