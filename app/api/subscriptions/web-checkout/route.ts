import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';
import { verifyWebCheckoutToken } from '@/lib/auth/web-checkout-token';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://al-aqd.app';

/**
 * POST /api/subscriptions/web-checkout
 *
 * Body: { token: string, planId: PlanId }
 *
 * Validates the one-time web-token (issued by /api/subscriptions/web-token),
 * creates a Stripe Checkout session, and returns its URL.
 *
 * Success/cancel URLs route through /subscribe/(success|cancel) which then deep
 * link back into the mobile app via the `alaqd://` scheme.
 */
export async function POST(request: NextRequest) {
    try {
        if (!stripe) {
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        await connectDB();

        const body = await request.json();
        const { token, planId } = body as { token?: string; planId?: PlanId };

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const decoded = verifyWebCheckoutToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const finalPlanId = planId || decoded.planId;
        if (!finalPlanId) {
            return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
        }

        const plan = PLAN_MAP.get(finalPlanId);
        if (!plan) {
            return NextResponse.json({ error: `Invalid planId: ${finalPlanId}` }, { status: 400 });
        }

        const user = await User.findById(decoded.userId)
            .select('name email phoneNumber subscription stripeCustomerId')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get or create Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: user.name,
                email: user.email || undefined,
                phone: user.phoneNumber || undefined,
                metadata: { userId: decoded.userId },
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(decoded.userId, {
                $set: { stripeCustomerId: customerId },
            });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: plan.currency,
                        product_data: {
                            name: `Al-Aqd Gold — ${plan.name}`,
                            description: `${plan.durationMonths} month Gold subscription`,
                        },
                        unit_amount: plan.priceAmount,
                        recurring: {
                            interval: 'month',
                            interval_count: plan.durationMonths,
                        },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${APP_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_BASE_URL}/subscribe/cancel`,
            metadata: { userId: decoded.userId, planId: finalPlanId },
            subscription_data: {
                metadata: { userId: decoded.userId, planId: finalPlanId },
            },
        });

        return NextResponse.json({
            success: true,
            checkoutUrl: session.url,
            sessionId: session.id,
        });
    } catch (error) {
        console.error('web-checkout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
