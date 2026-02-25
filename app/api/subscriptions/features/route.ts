import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { getFeaturesForUser } from '@/lib/subscription/plans';

/**
 * GET /api/subscriptions/features
 * Returns the feature access flags for the current user based on their plan.
 * Used by the mobile app to conditionally enable/disable premium features.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const user = await User.findById(authResult.user.userId)
            .select('subscription')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const sub = user.subscription;
        const isExpired = sub?.endDate ? new Date(sub.endDate) < new Date() : false;
        const activeSubscription = (sub?.isActive && !isExpired) ? sub : undefined;

        const features = getFeaturesForUser(activeSubscription as any);

        return NextResponse.json({
            success: true,
            plan:     activeSubscription?.plan ?? 'free',
            isPremium: (activeSubscription?.plan ?? 'free') !== 'free',
            features,
        });
    } catch (error) {
        console.error('Get features error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
