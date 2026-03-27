import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Order } from '@/lib/db/models/Order';
import { Transaction } from '@/lib/db/models/Transaction';
import { requireAuth } from '@/lib/auth/middleware';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';

// Helper to generate order number
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
}

// Helper to generate transaction number
function generateTransactionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRX-${timestamp}${random}`;
}

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const APP_BASE_URL    = process.env.APP_BASE_URL    || 'https://al-aqd.app';
const APP_SCHEME      = process.env.EXPO_PUBLIC_APP_SCHEME || 'alaqd';

/**
 * POST /api/subscriptions/checkout
 * Initiate a subscription purchase.
 *
 * Body: { planId: PlanId }
 *
 * Response modes:
 *   mode: 'stripe'   → { checkoutUrl }  — open in browser for payment
 *   mode: 'sandbox'  → { success: true }  — immediately activates (dev only)
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { planId } = body as { planId: PlanId };

        const plan = PLAN_MAP.get(planId);
        if (!plan) {
            return NextResponse.json({ error: `Invalid planId: ${planId}` }, { status: 400 });
        }

        const user = await User.findById(authResult.user.userId)
            .select('name email phoneNumber subscription stripeCustomerId')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // ── SANDBOX MODE (no Stripe keys) ─────────────────────────────────
        if (!stripe) {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + plan.durationMonths);

            await User.findByIdAndUpdate(authResult.user.userId, {
                $set: {
                    subscription: {
                        plan: plan.tier,
                        isActive: true,
                        startDate,
                        endDate,
                        cancelledAt: undefined,
                    },
                },
            });

            // Create order for sandbox mode
            const orderNumber = generateOrderNumber();
            await Order.create({
                orderNumber,
                userId: authResult.user.userId,
                customerName: user.name,
                customerEmail: user.email,
                items: [{
                    name: plan.name,
                    description: `${plan.durationMonths} month subscription`,
                    price: plan.priceAmount,
                    quantity: 1,
                    total: plan.priceAmount,
                }],
                subtotal: plan.priceAmount,
                tax: 0,
                total: plan.priceAmount,
                status: 'completed',
                paymentStatus: 'paid',
                payment: {
                    method: 'sandbox',
                    provider: 'sandbox',
                },
                planId,
                completedAt: new Date(),
            });

            // Create transaction for sandbox mode
            await Transaction.create({
                transactionNumber: generateTransactionNumber(),
                userId: authResult.user.userId,
                type: 'debit',
                amount: plan.priceAmount,
                currency: 'USD',
                description: `Subscription: ${plan.name}`,
                status: 'completed',
                paymentMethod: 'sandbox',
                provider: 'sandbox',
                completedAt: new Date(),
            });

            return NextResponse.json({
                success: true,
                mode: 'sandbox',
                message: `[DEV] Subscription "${plan.name}" activated instantly. Set STRIPE_SECRET_KEY to enable real payments.`,
                subscription: { plan: plan.tier, isActive: true, startDate, endDate },
            });
        }

        // ── STRIPE MODE ───────────────────────────────────────────────────

        // Get or create Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                name:     user.name,
                email:    user.email || undefined,
                phone:    user.phoneNumber || undefined,
                metadata: { userId: authResult.user.userId },
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(authResult.user.userId, {
                $set: { stripeCustomerId: customerId },
            });
        }

        // Map plan duration to Stripe recurring interval
        const interval: 'month' = 'month';
        const intervalCount = plan.durationMonths;

        // Create Stripe Checkout Session with inline price_data (no pre-created products needed)
        const session = await stripe.checkout.sessions.create({
            customer:   customerId,
            mode:       'subscription',
            line_items: [{
                price_data: {
                    currency: plan.currency,
                    product_data: {
                        name: `Al-Aqd Gold — ${plan.name}`,
                        description: `${plan.durationMonths} month Gold subscription`,
                    },
                    unit_amount: plan.priceAmount,
                    recurring: {
                        interval,
                        interval_count: intervalCount,
                    },
                },
                quantity: 1,
            }],
            success_url: `${APP_BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:  `${APP_BASE_URL}/subscription/cancel`,
            metadata: {
                userId: authResult.user.userId,
                planId,
            },
            subscription_data: {
                metadata: { userId: authResult.user.userId, planId },
            },
        });

        return NextResponse.json({
            success:     true,
            mode:        'stripe',
            checkoutUrl: session.url,
            sessionId:   session.id,
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
