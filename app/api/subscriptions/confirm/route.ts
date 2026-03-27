import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
    })
    : null;

/**
 * POST /api/subscriptions/confirm
 * Verifies a subscription's payment status with Stripe and activates it in the DB.
 *
 * Body: { subscriptionId: string }
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { subscriptionId } = body as { subscriptionId: string };

        if (!subscriptionId) {
            return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
        }

        if (!stripe) {
            return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
        }

        // Retrieve the subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Verify this subscription belongs to the authenticated user
        if (subscription.metadata?.userId !== authResult.user.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check subscription is active
        if (subscription.status !== 'active') {
            return NextResponse.json({
                error: `Subscription is not active (status: ${subscription.status})`,
            }, { status: 400 });
        }

        const planId = subscription.metadata?.planId as PlanId | undefined;
        const plan = planId ? PLAN_MAP.get(planId) : undefined;

        if (!plan) {
            return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
        }

        const startDate = new Date((subscription as any).current_period_start * 1000);
        const endDate = new Date((subscription as any).current_period_end * 1000);

        // Activate subscription in DB
        await User.findByIdAndUpdate(authResult.user.userId, {
            $set: {
                stripeSubscriptionId: subscriptionId,
                subscription: {
                    plan: plan.tier,
                    isActive: true,
                    startDate,
                    endDate,
                    cancelledAt: undefined,
                },
            },
        });

        return NextResponse.json({
            success: true,
            subscription: {
                plan: plan.tier,
                isActive: true,
                startDate,
                endDate,
            },
        });
    } catch (error: any) {
        console.error('Subscription confirm error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
