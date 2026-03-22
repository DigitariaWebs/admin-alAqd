import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeMatch } from '@/lib/discover/helpers';

/**
 * GET /api/matches/mutual
 *
 * Returns mutual matches that haven't had any messages yet —
 * i.e. "new matches" waiting for the first message.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

        const currentUserId = new mongoose.Types.ObjectId(authResult.user.userId);

        // Mutual matches = active matches with no messages yet
        const matchQuery = {
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            isActive: true,
            lastMessage: { $exists: false },
        };

        const skip = (page - 1) * limit;

        const [matches, total] = await Promise.all([
            Match.find(matchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Match.countDocuments(matchQuery),
        ]);

        const otherUserIds = matches.map((m) =>
            m.user1.toString() === authResult.user.userId ? m.user2 : m.user1
        );

        const otherUsers = await User.find({ _id: { $in: otherUserIds } })
          .select(
            "name gender photos photoBlurEnabled dateOfBirth location isPhoneVerified isEmailVerified subscription lastActive",
          )
          .lean();

        const userMap = new Map(otherUsers.map((u) => [u._id.toString(), u]));

        const serialized = matches
            .map((match) => {
                const otherId =
                    match.user1.toString() === authResult.user.userId
                        ? match.user2.toString()
                        : match.user1.toString();
                const otherUser = userMap.get(otherId);
                if (!otherUser) return null;
                return serializeMatch(match, authResult.user.userId, otherUser);
            })
            .filter(Boolean);

        return NextResponse.json({
            success: true,
            matches: serialized,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + matches.length < total,
            },
        });
    } catch (error) {
        console.error('Get mutual matches error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
