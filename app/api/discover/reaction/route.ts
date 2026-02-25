import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { Match } from '@/lib/db/models/Match';
import { Reaction } from '@/lib/db/models/Reaction';
import { requireAuth } from '@/lib/auth/middleware';
import { computeCompatibility } from '@/lib/discover/helpers';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { targetUserId, emoji, message } = body;

        if (!targetUserId || !emoji) {
            return NextResponse.json(
                { error: 'targetUserId and emoji are required' },
                { status: 400 }
            );
        }

        const currentUserId = authResult.user.userId;

        if (currentUserId === targetUserId) {
            return NextResponse.json({ error: 'Cannot react to your own profile' }, { status: 400 });
        }

        const targetUser = await User.findById(targetUserId).select(
            'name photos status interests religiousPractice'
        );

        if (!targetUser || targetUser.status === 'banned') {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Store the reaction
        await Reaction.findOneAndUpdate(
            { fromUser: currentUserId, toUser: targetUserId },
            { emoji, message, isRead: false },
            { upsert: true, new: true }
        );

        // Sending a reaction implicitly acts as a "like"
        await Swipe.findOneAndUpdate(
            { fromUser: currentUserId, toUser: targetUserId },
            { action: 'like' },
            { upsert: true, new: true }
        );

        // Check if target already liked the current user → it's a match
        const theirSwipe = await Swipe.findOne({
            fromUser: targetUserId,
            toUser: currentUserId,
            action: { $in: ['like', 'superlike'] },
        });

        let matched = false;
        let matchId: string | undefined;
        let matchCreatedAt: Date | undefined;

        if (theirSwipe) {
            const [u1, u2] = [currentUserId, targetUserId].sort();

            const currentUser = await User.findById(currentUserId).select(
                'interests religiousPractice'
            );

            const sharedInterests = (currentUser?.interests ?? []).filter((i: string) =>
                (targetUser.interests ?? []).includes(i)
            );
            const compatibility = computeCompatibility(
                currentUser?.interests ?? [],
                currentUser?.religiousPractice,
                targetUser.interests ?? [],
                targetUser.religiousPractice
            );

            const upsertedMatch = await Match.findOneAndUpdate(
                { user1: u1, user2: u2 },
                {
                    $setOnInsert: {
                        user1: u1,
                        user2: u2,
                        matchType: 'like',
                        isActive: true,
                        similarities: sharedInterests,
                        compatibility,
                    },
                },
                { upsert: true, new: true }
            );

            matched = true;
            matchId = upsertedMatch._id.toString();
            matchCreatedAt = upsertedMatch.createdAt;
        }

        return NextResponse.json({
            success: true,
            emoji,
            matched,
            ...(matched && {
                match: {
                    id: matchId,
                    matchedUser: {
                        id: targetUser._id.toString(),
                        name: targetUser.name,
                        photo: (targetUser.photos ?? [])[0] ?? '',
                    },
                    matchedAt: matchCreatedAt?.toISOString(),
                },
            }),
        });
    } catch (error) {
        console.error('Reaction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
