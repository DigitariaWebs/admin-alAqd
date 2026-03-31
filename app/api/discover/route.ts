import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { Block } from '@/lib/db/models/Block';
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
  "faithTags personality photoBlurEnabled nationality education";

// Fetch a larger pool to score and rank, then return the top page
const SCORING_POOL_SIZE = 100;

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
        const countryFilter = searchParams.get('country')?.trim();

        const currentUser = await User.findById(authResult.user.userId).select(
            'gender preferences interests religiousPractice ethnicity nationality education maritalStatus dateOfBirth personality faithTags'
        );

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Exclude swiped users + blocked users (both directions)
        const [swipedIds, blockedByMe, blockedMe] = await Promise.all([
            Swipe.find({ fromUser: authResult.user.userId }).distinct('toUser'),
            Block.find({ blockerId: authResult.user.userId }).distinct('blockedId'),
            Block.find({ blockedId: authResult.user.userId }).distinct('blockerId'),
        ]);

        const excludedIds = [
            ...swipedIds,
            ...blockedByMe,
            ...blockedMe,
            currentUser._id,
        ];

        const targetGender = currentUser.gender === 'male' ? 'female' : 'male';
        const prefs = currentUser.preferences;

        const query: Record<string, unknown> = {
            _id: { $nin: excludedIds },
            gender: targetGender,
            status: 'active',
            isOnboarded: true,
            role: 'user',
            photos: { $exists: true, $not: { $size: 0 } },
        };

        // Age range from preferences (keep as hard filter - fundamental preference)
        Object.assign(query, buildAgeRangeFilter(prefs?.ageRange));

        const countryClause = buildCountryFilter(countryFilter);
        if (countryClause) {
            query.$and = [...((query.$and as Record<string, unknown>[] | undefined) ?? []), countryClause];
        }

        const total = await User.countDocuments(query);

        // Fetch a pool of candidates for scoring
        const poolSize = Math.min(SCORING_POOL_SIZE, total);
        const pool = await User.find(query)
            .select(DISCOVER_SELECT)
            .sort({ lastActive: -1 })
            .limit(poolSize)
            .lean();

        // Score each profile against the current user
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

        // Sort by score descending (highest compatibility first)
        scored.sort((a, b) => b.score - a.score);

        // Paginate the scored results
        const skip = (page - 1) * limit;
        const pageResults = scored.slice(skip, skip + limit);

        const profileCards = pageResults.map(({ user, score }) => ({
            ...serializeProfileCard(
                user,
                currentUser.interests ?? [],
                currentUser.religiousPractice,
                authResult.user.userId
            ),
            compatibility: score,
        }));

        console.log(`[DISCOVER] user=${currentUser.gender} page=${page} limit=${limit} total=${total} pool=${pool.length} returning=${profileCards.length} hasMore=${skip + pageResults.length < Math.min(poolSize, total)}`);

        return NextResponse.json({
            success: true,
            profiles: profileCards,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + pageResults.length < Math.min(poolSize, total),
            },
        });
    } catch (error) {
        console.error('Discover queue error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
