import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { requireAuth } from '@/lib/auth/middleware';
import { buildAgeRangeFilter, serializeProfileCard } from '@/lib/discover/helpers';

const DISCOVER_SELECT =
  "name dateOfBirth gender location bio profession photos interests religiousPractice " +
  "ethnicity height maritalStatus isPhoneVerified isEmailVerified subscription lastActive " +
  "faithTags personality photoBlurEnabled";

/**
 * POST /api/discover/refresh
 *
 * Returns a fresh swipe queue. Unlike the regular GET /api/discover,
 * this only excludes previously LIKED / SUPERLIKED profiles — passes are
 * re-included so users get a second chance at profiles they previously skipped.
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json().catch(() => ({}));
        const limit = Math.min(50, Math.max(1, parseInt(body?.limit ?? '10')));

        const currentUser = await User.findById(authResult.user.userId).select(
            'gender preferences interests religiousPractice'
        );

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // On refresh, only exclude profiles that were positively swiped (not passes)
        const likedIds = await Swipe.find({
            fromUser: authResult.user.userId,
            action: { $in: ['like', 'superlike'] },
        }).distinct('toUser');

        const targetGender = currentUser.gender === 'male' ? 'female' : 'male';
        const prefs = currentUser.preferences;

        const query: Record<string, unknown> = {
            _id: { $nin: [...likedIds, currentUser._id] },
            gender: targetGender,
            status: 'active',
            isOnboarded: true,
            role: 'user',
            photos: { $exists: true, $not: { $size: 0 } },
        };

        Object.assign(query, buildAgeRangeFilter(prefs?.ageRange));

        if (prefs?.religiousPractice?.length) {
            query.religiousPractice = { $in: prefs.religiousPractice };
        }
        if (prefs?.ethnicity?.length) {
            query.ethnicity = { $in: prefs.ethnicity };
        }
        if (prefs?.education?.length) {
            query.education = { $in: prefs.education };
        }

        const [profiles, total] = await Promise.all([
            User.find(query)
                .select(DISCOVER_SELECT)
                // Randomize the order so the refresh feels fresh
                .sort({ lastActive: -1 })
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        const profileCards = profiles.map((user) =>
            serializeProfileCard(
                user,
                currentUser.interests ?? [],
                currentUser.religiousPractice,
                authResult.user.userId
            )
        );

        return NextResponse.json({
            success: true,
            profiles: profileCards,
            pagination: {
                page: 1,
                limit,
                total,
                hasMore: profiles.length < total,
            },
        });
    } catch (error) {
        console.error('Refresh queue error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
