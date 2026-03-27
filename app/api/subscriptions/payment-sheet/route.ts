import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';

// Pin to acacia API version — basil breaks latest_invoice.payment_intent expansion
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
    })
    : null;

/**
 * POST /api/subscriptions/payment-sheet
 * Creates a Stripe subscription with incomplete payment and returns
 * the data needed by the mobile Payment Sheet.
 *
 * Body: { planId: PlanId }
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

        if (!stripe) {
            return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
        }

        const user = await User.findById(authResult.user.userId)
            .select('name email phoneNumber stripeCustomerId')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // ── Get or create Stripe customer ────────────────────────────────
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: user.name,
                email: user.email || undefined,
                phone: user.phoneNumber || undefined,
                metadata: { userId: authResult.user.userId },
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(authResult.user.userId, {
                $set: { stripeCustomerId: customerId },
            });
        }

        // ── Cancel any stale incomplete subscriptions ────────────────────
        const existingSubs = await stripe.subscriptions.list({
            customer: customerId,
            status: 'incomplete',
            limit: 10,
        });
        for (const sub of existingSubs.data) {
            await stripe.subscriptions.cancel(sub.id);
        }

        // ── Create ephemeral key ─────────────────────────────────────────
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customerId },
            { apiVersion: '2024-12-18.acacia' },
        );

        // ── Create or reuse a Stripe Price for this plan ─────────────────
        const existingPrices = await stripe.prices.search({
            query: `active:"true" AND metadata["planId"]:"${planId}"`,
            limit: 1,
        });

        let priceId: string;
        if (existingPrices.data.length > 0) {
            priceId = existingPrices.data[0].id;
        } else {
            const price = await stripe.prices.create({
                currency: plan.currency,
                unit_amount: plan.priceAmount,
                recurring: {
                    interval: 'month',
                    interval_count: plan.durationMonths,
                },
                product_data: {
                    name: `Al-Aqd Gold — ${plan.name}`,
                },
                metadata: { planId },
            });
            priceId = price.id;
        }

        // ── Create subscription with incomplete payment ──────────────────
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: authResult.user.userId,
                planId,
            },
        });

        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

        if (!paymentIntent?.client_secret) {
            console.error('Payment intent missing:', JSON.stringify({
                subscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                invoiceId: invoice?.id,
                invoiceStatus: invoice?.status,
                paymentIntent: paymentIntent,
            }));
            await stripe.subscriptions.cancel(subscription.id);
            return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customerId,
            subscriptionId: subscription.id,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        });
    } catch (error: any) {
        console.error('Payment sheet error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
