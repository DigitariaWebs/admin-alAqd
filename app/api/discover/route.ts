import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { Block } from '@/lib/db/models/Block';
import { requireAuth } from '@/lib/auth/middleware';
import {
    buildAgeRangeFilter,
    buildCountryFilter,
    serializeProfileCard,
} from '@/lib/discover/helpers';

const DISCOVER_SELECT =
  "name dateOfBirth gender location bio profession photos interests religiousPractice " +
  "ethnicity height maritalStatus isPhoneVerified isEmailVerified subscription lastActive " +
  "faithTags personality photoBlurEnabled";

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
            'gender preferences interests religiousPractice'
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
            // Must have at least one photo
            photos: { $exists: true, $not: { $size: 0 } },
        };

        // Age range from preferences
        Object.assign(query, buildAgeRangeFilter(prefs?.ageRange));

        // Optional preference filters
        if (prefs?.religiousPractice?.length) {
            query.religiousPractice = { $in: prefs.religiousPractice };
        }
        if (prefs?.ethnicity?.length) {
            query.ethnicity = { $in: prefs.ethnicity };
        }
        if (prefs?.education?.length) {
            query.education = { $in: prefs.education };
        }

        const countryClause = buildCountryFilter(countryFilter);
        if (countryClause) {
            query.$and = [...((query.$and as Record<string, unknown>[] | undefined) ?? []), countryClause];
        }

        const skip = (page - 1) * limit;

        const [profiles, total] = await Promise.all([
            User.find(query)
                .select(DISCOVER_SELECT)
                .sort({ lastActive: -1 })
                .skip(skip)
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
                page,
                limit,
                total,
                hasMore: skip + profiles.length < total,
            },
        });
    } catch (error) {
        console.error('Discover queue error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
