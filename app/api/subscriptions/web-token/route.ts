import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';
import { signWebCheckoutToken } from '@/lib/auth/web-checkout-token';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://al-aqd.app';

/**
 * POST /api/subscriptions/web-token
 *
 * Body: { planId?: PlanId }
 *
 * Auth: mobile JWT (Bearer)
 * Returns: { url } — open this in an in-app browser. The page is gated by the
 * one-time signed token (10-min TTL) and pre-selects the plan.
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json().catch(() => ({}));
        const planId = body?.planId as PlanId | undefined;

        if (planId && !PLAN_MAP.has(planId)) {
            return NextResponse.json({ error: `Invalid planId: ${planId}` }, { status: 400 });
        }

        await connectDB();
        const user = await User.findById(authResult.user.userId).select('name').lean();
        const firstName = user?.name ? (user.name as string).split(' ')[0] : undefined;

        const token = signWebCheckoutToken({
            userId: authResult.user.userId,
            planId,
            firstName,
        });

        const params = new URLSearchParams({ token });
        if (planId) params.set('plan', planId);

        return NextResponse.json({
            success: true,
            url: `${APP_BASE_URL}/subscribe?${params.toString()}`,
        });
    } catch (error) {
        console.error('web-token error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
