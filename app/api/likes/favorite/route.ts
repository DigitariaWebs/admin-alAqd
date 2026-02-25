import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Favorite } from '@/lib/db/models/Favorite';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * POST /api/likes/favorite
 * Toggle favorite status for a user.
 *
 * Body: { targetUserId: string }
 * Returns: { isFavorited: boolean }
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
        }

        const currentUserId = authResult.user.userId;

        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: 'Cannot favorite yourself' }, { status: 400 });
        }

        const target = await User.findById(targetUserId).select('status');
        if (!target || target.status === 'banned') {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const existing = await Favorite.findOne({
            fromUser: currentUserId,
            toUser: targetUserId,
        });

        if (existing) {
            await existing.deleteOne();
            return NextResponse.json({ success: true, isFavorited: false });
        }

        await Favorite.create({ fromUser: currentUserId, toUser: targetUserId });
        return NextResponse.json({ success: true, isFavorited: true });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
