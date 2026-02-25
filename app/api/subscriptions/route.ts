import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

/**
 * GET /api/subscriptions
 * Returns the current user's subscription status.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const user = await User.findById(authResult.user.userId)
            .select('subscription stripeCustomerId stripeSubscriptionId')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const sub = user.subscription;
        const isExpired = sub?.endDate ? new Date(sub.endDate) < new Date() : false;
        const isActive  = (sub?.isActive ?? false) && !isExpired;

        return NextResponse.json({
            success: true,
            subscription: {
                plan:       isActive ? (sub?.plan ?? 'free') : 'free',
                isActive,
                startDate:  sub?.startDate ?? null,
                endDate:    sub?.endDate   ?? null,
                cancelledAt:sub?.cancelledAt ?? null,
                hasStripe:  !!user.stripeSubscriptionId,
            },
        });
    } catch (error) {
        console.error('Get subscription status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── DELETE /api/subscriptions ────────────────────────────────────────────────

/**
 * DELETE /api/subscriptions
 * Cancel the current user's subscription.
 * - With Stripe: cancels at period end (user keeps access until endDate)
 * - Sandbox: immediately marks as cancelled
 */
export async function DELETE(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const user = await User.findById(authResult.user.userId)
            .select('subscription stripeSubscriptionId')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!user.subscription?.isActive) {
            return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
        }

        if (stripe && user.stripeSubscriptionId) {
            // Cancel at period end — user retains access until billing cycle ends
            await stripe.subscriptions.update(user.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });
        }

        // Mark as cancelled in our DB (access retained until endDate)
        await User.findByIdAndUpdate(authResult.user.userId, {
            $set: { 'subscription.cancelledAt': new Date() },
        });

        return NextResponse.json({
            success: true,
            message: 'Subscription cancelled. You retain access until the end of your billing period.',
            endDate: user.subscription?.endDate ?? null,
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
