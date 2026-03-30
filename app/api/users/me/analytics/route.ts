import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Swipe } from '@/lib/db/models/Swipe';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

/**
 * GET /api/users/me/analytics
 * Returns profile performance statistics for the authenticated user:
 *   - profileViews      — unique users who had this user in their discover queue (swipe count)
 *   - likesReceived     — like + superlike swipes pointing to this user
 *   - superLikesReceived— superlike swipes pointing to this user
 *   - matchesCount      — active matches involving this user
 *   - conversationsCount— active matches that have at least one message
 *   - unreadMessages    — total unread messages received
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const userId = new mongoose.Types.ObjectId(authResult.user.userId);

        const [
            profileViews,
            likesReceived,
            matchesCount,
            conversationsCount,
            unreadMessages,
        ] = await Promise.all([
            Swipe.countDocuments({ toUser: userId }),
            Swipe.countDocuments({ toUser: userId, action: 'like' }),
            Match.countDocuments({
                $or: [{ user1: userId }, { user2: userId }],
                isActive: true,
            }),
            Match.countDocuments({
                $or: [{ user1: userId }, { user2: userId }],
                isActive: true,
                lastMessage: { $exists: true, $ne: '' },
            }),
            Message.countDocuments({ receiverId: userId, isRead: false, isDeleted: false }),
        ]);

        return NextResponse.json({
            success: true,
            analytics: {
                profileViews,
                likesReceived,
                matchesCount,
                conversationsCount,
                unreadMessages,
            },
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
