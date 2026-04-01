import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { requireAuth } from '@/lib/auth/middleware';
import {
    buildAgeRangeFilter,
    buildCountryFilter,
    computeMatchScore,
    serializeProfileCard,
} from '@/lib/discover/helpers';

const DISCOVER_SELECT =
  "name dateOfBirth gender location bio profession photos interests religiousPractice " +
  "ethnicity height maritalStatus isPhoneVerified isEmailVerified subscription lastActive " +
  "faithTags personality photoBlurEnabled unblurredFor nationality education";

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
        const countryFilter = typeof body?.country === 'string' ? body.country.trim() : undefined;

        const currentUser = await User.findById(authResult.user.userId).select(
            'gender preferences interests religiousPractice ethnicity nationality education maritalStatus dateOfBirth personality faithTags'
        );

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // On refresh, only exclude profiles that were positively swiped (not passes)
        const likedIds = await Swipe.find({
            fromUser: authResult.user.userId,
            action: 'like',
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

        const countryClause = buildCountryFilter(countryFilter);
        if (countryClause) {
            query.$and = [...((query.$and as Record<string, unknown>[] | undefined) ?? []), countryClause];
        }

        const total = await User.countDocuments(query);
        const pool = await User.find(query)
            .select(DISCOVER_SELECT)
            .sort({ lastActive: -1 })
            .limit(100)
            .lean();

        const me = {
            interests: currentUser.interests ?? [],
            religiousPractice: currentUser.religiousPractice,
            ethnicity: currentUser.ethnicity ?? [],
            nationality: currentUser.nationality ?? [],
            education: currentUser.education,
            maritalStatus: currentUser.maritalStatus,
            dateOfBirth: currentUser.dateOfBirth,
            personality: currentUser.personality ?? [],
            faithTags: currentUser.faithTags ?? [],
        };

        const scored = pool.map((user) => ({
            user,
            score: computeMatchScore(me, {
                interests: user.interests ?? [],
                religiousPractice: user.religiousPractice,
                ethnicity: user.ethnicity ?? [],
                nationality: user.nationality ?? [],
                education: user.education,
                maritalStatus: user.maritalStatus,
                dateOfBirth: user.dateOfBirth,
                lastActive: user.lastActive,
                personality: user.personality ?? [],
                faithTags: user.faithTags ?? [],
            }),
        }));

        scored.sort((a, b) => b.score - a.score);

        const profileCards = scored.slice(0, limit).map(({ user, score }) => ({
            ...serializeProfileCard(
                user,
                currentUser.interests ?? [],
                currentUser.religiousPractice,
                authResult.user.userId
            ),
            compatibility: score,
        }));

        return NextResponse.json({
            success: true,
            profiles: profileCards,
            pagination: {
                page: 1,
                limit,
                total,
                hasMore: profileCards.length < total,
            },
        });
    } catch (error) {
        console.error('Refresh queue error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
