import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { Match } from '@/lib/db/models/Match';
import { Favorite } from '@/lib/db/models/Favorite';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeLikeCard } from '@/lib/discover/helpers';

const USER_SELECT =
  "name dateOfBirth profession location gender photos photoBlurEnabled isPhoneVerified isEmailVerified " +
  "subscription lastActive religiousPractice";

/**
 * GET /api/likes/sent
 * Returns users the current user has liked (positive swipes sent).
 *
 * Query params:
 *   page  = 1, 2, …
 *   limit = 1–50 (default: 20)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

        const currentUserId = new mongoose.Types.ObjectId(authResult.user.userId);

        const swipes = await Swipe.find({
            fromUser: currentUserId,
            action: 'like',
        })
            .sort({ createdAt: -1 })
            .lean();

        const toIds = swipes.map((s) => s.toUser);
        const users = await User.find({ _id: { $in: toIds }, status: { $ne: 'banned' } })
            .select(USER_SELECT)
            .lean();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const matchDocs = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            isActive: true,
        }).lean();
        const mutualUserIds = new Set(
            matchDocs.flatMap((m) => [m.user1.toString(), m.user2.toString()])
        );
        mutualUserIds.delete(authResult.user.userId);

        const favDocs = await Favorite.find({ fromUser: currentUserId }).distinct('toUser');
        const favSet  = new Set(favDocs.map((id: any) => id.toString()));

        const validSwipes = swipes.filter((s) => userMap.has(s.toUser.toString()));
        const total = validSwipes.length;
        const skip  = (page - 1) * limit;
        const paged = validSwipes.slice(skip, skip + limit);

        const cards = paged.map((swipe) => {
            const user = userMap.get(swipe.toUser.toString())!;
            return serializeLikeCard(
                swipe,
                user,
                mutualUserIds.has(swipe.toUser.toString()),
                favSet.has(swipe.toUser.toString()),
                authResult.user.userId
            );
        });

        return NextResponse.json({
            success: true,
            likes: cards,
            pagination: { page, limit, total, hasMore: skip + paged.length < total },
        });
    } catch (error) {
        console.error('Get sent likes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
