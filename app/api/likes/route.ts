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
  "name dateOfBirth profession location gender photos photoBlurEnabled unblurredFor isPhoneVerified isEmailVerified " +
  "subscription lastActive religiousPractice nationality";

/**
 * GET /api/likes
 * Returns users who liked the current user.
 *
 * Query params:
 *   filter  = all | new | mutual | premium   (default: all)
 *   page    = 1, 2, …
 *   limit   = 1–50 (default: 20)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') ?? 'all';
        const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
        const limit  = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));

        const currentUserId = new mongoose.Types.ObjectId(authResult.user.userId);

        // Base query: swipes pointing at me with a positive action
        const swipeQuery: Record<string, unknown> = {
            toUser: currentUserId,
            action: 'like',
        };

        // Extra filter: "new" = last 48 h
        if (filter === 'new') {
            swipeQuery.createdAt = { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) };
        }

        const skip = (page - 1) * limit;

        let swipes = await Swipe.find(swipeQuery)
            .sort({ createdAt: -1 })
            .lean();

        // Fetch all liking-user docs at once
        const fromIds = swipes.map((s) => s.fromUser);
        const userQuery: Record<string, unknown> = {
            _id: { $in: fromIds },
            status: { $ne: 'banned' },
        };

        // "premium" filter: only users whose subscription is active
        if (filter === 'premium') {
            userQuery['subscription.isActive'] = true;
        }

        const users = await User.find(userQuery).select(USER_SELECT).lean();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        // Remove swipes whose user no longer exists or was banned
        swipes = swipes.filter((s) => userMap.has(s.fromUser.toString()));

        // Match ids for "mutual" lookup
        const matchDocs = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            isActive: true,
        }).lean();
        const mutualUserIds = new Set(
            matchDocs.flatMap((m) => [m.user1.toString(), m.user2.toString()])
        );
        mutualUserIds.delete(authResult.user.userId);

        // "mutual" filter: only likes from users I have a match with
        if (filter === 'mutual') {
            swipes = swipes.filter((s) => mutualUserIds.has(s.fromUser.toString()));
        }

        // Favorited ids
        const favDocs = await Favorite.find({ fromUser: currentUserId }).distinct('toUser');
        const favSet = new Set(favDocs.map((id: any) => id.toString()));

        const total = swipes.length;
        const paged = swipes.slice(skip, skip + limit);

        const cards = paged.map((swipe) => {
            const user = userMap.get(swipe.fromUser.toString())!;
            return serializeLikeCard(
                swipe,
                user,
                mutualUserIds.has(swipe.fromUser.toString()),
                favSet.has(swipe.fromUser.toString()),
                authResult.user.userId
            );
        });

        return NextResponse.json({
            success: true,
            filter,
            likes: cards,
            pagination: { page, limit, total, hasMore: skip + paged.length < total },
        });
    } catch (error) {
        console.error('Get likes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
