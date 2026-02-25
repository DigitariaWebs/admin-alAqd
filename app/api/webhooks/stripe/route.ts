import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for subscription lifecycle management.
 *
 * Required events to enable in Stripe Dashboard:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 */
export async function POST(request: NextRequest) {
    if (!stripe) {
        return NextResponse.json({ received: true, mode: 'sandbox' });
    }

    const body      = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
        console.warn('Stripe webhook: missing signature or secret');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectDB();

    try {
        switch (event.type) {

            // ── New checkout completed (first subscription) ───────────────
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode !== 'subscription') break;

                const userId = session.metadata?.userId;
                const planId = session.metadata?.planId as PlanId | undefined;
                if (!userId || !planId) break;

                const plan = PLAN_MAP.get(planId);
                if (!plan) break;

                const stripeSubId = session.subscription as string;
                const stripeSub   = await stripe.subscriptions.retrieve(stripeSubId);

                const startDate = new Date(stripeSub.current_period_start * 1000);
                const endDate   = new Date(stripeSub.current_period_end   * 1000);

                await User.findByIdAndUpdate(userId, {
                    $set: {
                        stripeSubscriptionId: stripeSubId,
                        subscription: {
                            plan:      plan.tier,
                            isActive:  true,
                            startDate,
                            endDate,
                            cancelledAt: undefined,
                        },
                    },
                });
                console.log(`✅  Stripe: subscription activated for user ${userId} — plan ${planId}`);
                break;
            }

            // ── Subscription updated (renewal / downgrade / cancel) ───────
            case 'customer.subscription.updated': {
                const stripeSub = event.data.object as Stripe.Subscription;
                const userId    = stripeSub.metadata?.userId;
                if (!userId) break;

                const endDate    = new Date(stripeSub.current_period_end * 1000);
                const isCancelled = stripeSub.cancel_at_period_end;

                await User.findByIdAndUpdate(userId, {
                    $set: {
                        'subscription.endDate':     endDate,
                        'subscription.cancelledAt': isCancelled ? new Date() : undefined,
                    },
                });
                break;
            }

            // ── Subscription deleted / expired ────────────────────────────
            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object as Stripe.Subscription;
                const userId    = stripeSub.metadata?.userId;
                if (!userId) break;

                await User.findByIdAndUpdate(userId, {
                    $set: {
                        stripeSubscriptionId: null,
                        subscription: {
                            plan:      'free',
                            isActive:  false,
                            startDate: undefined,
                            endDate:   undefined,
                        },
                    },
                });
                console.log(`ℹ️   Stripe: subscription expired for user ${userId}`);
                break;
            }

            // ── Payment failure ───────────────────────────────────────────
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                // Optionally send a notification here
                console.warn(`⚠️  Stripe: payment failed for customer ${customerId}`);
                break;
            }

            default:
                // Ignore unhandled event types
                break;
        }
    } catch (err) {
        console.error('Webhook handler error:', err);
        return NextResponse.json({ error: 'Handler error' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
