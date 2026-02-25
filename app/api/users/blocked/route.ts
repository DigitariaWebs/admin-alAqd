import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Block } from '@/lib/db/models/Block';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * GET /api/users/blocked
 * Returns the list of users that the current user has blocked,
 * with minimal public profile data for display.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const blocks = await Block.find({ blockerId: authResult.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        if (blocks.length === 0) {
            return NextResponse.json({ success: true, blocked: [] });
        }

        const blockedIds = blocks.map((b) => b.blockedId);
        const users = await User.find({ _id: { $in: blockedIds } })
            .select('name photos')
            .lean();

        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const blocked = blocks.map((b) => {
            const user = userMap.get(b.blockedId.toString());
            return {
                id:         b.blockedId.toString(),
                name:       user?.name ?? 'Utilisateur inconnu',
                photo:      (user?.photos ?? [])[0] ?? '',
                blockedAt:  b.createdAt,
            };
        });

        return NextResponse.json({ success: true, blocked });
    } catch (error) {
        console.error('Get blocked list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
