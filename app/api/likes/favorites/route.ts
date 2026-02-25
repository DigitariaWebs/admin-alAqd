import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Favorite } from '@/lib/db/models/Favorite';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeFavoriteCard } from '@/lib/discover/helpers';

const USER_SELECT =
    'name dateOfBirth profession location photos isPhoneVerified isEmailVerified ' +
    'subscription lastActive religiousPractice';

/**
 * GET /api/likes/favorites
 * Returns users the current user has favorited.
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
        const skip = (page - 1) * limit;

        const [favorites, total] = await Promise.all([
            Favorite.find({ fromUser: currentUserId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Favorite.countDocuments({ fromUser: currentUserId }),
        ]);

        const toIds = favorites.map((f) => f.toUser);
        const users = await User.find({ _id: { $in: toIds }, status: { $ne: 'banned' } })
            .select(USER_SELECT)
            .lean();
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        // Check mutual match status
        const matchDocs = await Match.find({
            $or: [{ user1: currentUserId }, { user2: currentUserId }],
            isActive: true,
        }).lean();
        const mutualIds = new Set(
            matchDocs.flatMap((m) => [m.user1.toString(), m.user2.toString()])
        );
        mutualIds.delete(authResult.user.userId);

        const cards = favorites
            .filter((f) => userMap.has(f.toUser.toString()))
            .map((fav) => {
                const user = userMap.get(fav.toUser.toString())!;
                const card = serializeFavoriteCard(fav, user);
                return { ...card, isMutual: mutualIds.has(fav.toUser.toString()) };
            });

        return NextResponse.json({
            success: true,
            favorites: cards,
            pagination: { page, limit, total, hasMore: skip + cards.length < total },
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
