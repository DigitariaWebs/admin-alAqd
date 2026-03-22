import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeConversation } from '@/lib/discover/helpers';

const PARTICIPANT_SELECT =
  "name dateOfBirth gender photos photoBlurEnabled isPhoneVerified isEmailVerified subscription lastActive";

/**
 * GET /api/conversations
 * Returns all active match-based conversations for the current user,
 * sorted by latest activity (newest message or match date).
 * Matches without messages ("new matches") are included at the bottom.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const currentUserId = new mongoose.Types.ObjectId(authResult.user.userId);

        const matches = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            isActive: true,
        })
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .lean();

        if (matches.length === 0) {
            return NextResponse.json({ success: true, conversations: [] });
        }

        // Collect participant IDs
        const participantIds = matches.map((m) =>
            m.user1.toString() === authResult.user.userId ? m.user2 : m.user1
        );

        const participants = await User.find({ _id: { $in: participantIds } })
            .select(PARTICIPANT_SELECT)
            .lean();
        const participantMap = new Map(participants.map((u) => [u._id.toString(), u]));

        // Unread counts for all conversations at once
        const unreadAgg = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: matches.map((m) => m._id) },
                    receiverId: currentUserId,
                    isRead: false,
                    isDeleted: false,
                },
            },
            { $group: { _id: '$conversationId', count: { $sum: 1 } } },
        ]);
        const unreadMap = new Map(unreadAgg.map((r) => [r._id.toString(), r.count as number]));

        // Last message for each conversation
        const lastMessages = await Message.aggregate([
            {
                $match: {
                    conversationId: { $in: matches.map((m) => m._id) },
                    isDeleted: false,
                },
            },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$conversationId', msg: { $first: '$$ROOT' } } },
        ]);
        const lastMessageMap = new Map(lastMessages.map((r) => [r._id.toString(), r.msg]));

        const conversations = matches
            .map((match) => {
                const otherId =
                    match.user1.toString() === authResult.user.userId
                        ? match.user2.toString()
                        : match.user1.toString();
                const participant = participantMap.get(otherId);
                if (!participant) return null;
                return serializeConversation(
                    match,
                    participant,
                    lastMessageMap.get(match._id.toString()) ?? null,
                    unreadMap.get(match._id.toString()) ?? 0,
                    authResult.user.userId
                );
            })
            .filter(Boolean);

        return NextResponse.json({ success: true, conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
