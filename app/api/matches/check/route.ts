import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeMatch } from '@/lib/discover/helpers';

/**
 * GET /api/matches/check?userId=<targetUserId>
 *
 * Check whether the current user and the given userId are matched.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('userId');

        if (!targetUserId) {
            return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
        }

        const currentUserId = authResult.user.userId;

        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: 'Cannot check match with yourself' }, { status: 400 });
        }

        // IDs are stored sorted — derive the correct order
        const [u1, u2] = [currentUserId, targetUserId].sort();

        const match = await Match.findOne({ user1: u1, user2: u2, isActive: true }).lean();

        if (!match) {
            return NextResponse.json({ success: true, isMatched: false });
        }

        const otherUser = await User.findById(targetUserId)
            .select(
                'name photos dateOfBirth location isPhoneVerified isEmailVerified subscription lastActive'
            )
            .lean();

        if (!otherUser) {
            return NextResponse.json({ success: true, isMatched: false });
        }

        return NextResponse.json({
            success: true,
            isMatched: true,
            match: serializeMatch(match, currentUserId, otherUser),
        });
    } catch (error) {
        console.error('Check match error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
