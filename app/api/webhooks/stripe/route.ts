import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Order } from '@/lib/db/models/Order';
import { Transaction } from '@/lib/db/models/Transaction';
import { PLAN_MAP, PlanId, SubscriptionPlan } from '@/lib/subscription/plans';

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

                const plan: SubscriptionPlan | undefined = PLAN_MAP.get(planId);
                if (!plan) break;

                // Get user info
                const user = await User.findById(userId).select('name email stripeCustomerId').lean();
                if (!user) break;

                const stripeSubId = session.subscription as string;
                const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);

                const startDate = new Date((stripeSub as any).current_period_start * 1000);
                const endDate = new Date((stripeSub as any).current_period_end * 1000);

                // Update user subscription
                await User.findByIdAndUpdate(userId, {
                    $set: {
                        stripeSubscriptionId: stripeSubId,
                        subscription: {
                            plan: plan.tier,
                            isActive: true,
                            startDate,
                            endDate,
                            cancelledAt: undefined,
                        },
                    },
                });

                // Create order
                const orderNumber = generateOrderNumber();
                const order = await Order.create({
                    orderNumber,
                    userId,
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
                        method: 'card',
                        provider: 'stripe',
                        stripePaymentIntentId: session.payment_intent as string || undefined,
                        stripeSessionId: session.id,
                    },
                    stripeCustomerId: user.stripeCustomerId,
                    subscriptionId: stripeSubId,
                    planId,
                    completedAt: new Date(),
                });

                // Create transaction
                await Transaction.create({
                    transactionNumber: generateTransactionNumber(),
                    orderId: order._id,
                    userId,
                    type: 'debit',
                    amount: plan.priceAmount,
                    currency: 'USD',
                    description: `Subscription: ${plan.name}`,
                    status: 'completed',
                    paymentMethod: 'card',
                    provider: 'stripe',
                    stripePaymentIntentId: session.payment_intent as string || undefined,
                    stripeSessionId: session.id,
                    completedAt: new Date(),
                });

                console.log(`✅  Stripe: subscription activated for user ${userId} — plan ${planId}, order ${orderNumber}`);
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

            // ── Subscription deleted / expired ───────────────────────────
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
                console.warn(`⚠️  Stripe: payment failed for customer ${customerId}`);

                // Find user by stripe customer id and update order status
                const user = await User.findOne({ stripeCustomerId: customerId }).select('_id').lean();
                if (user) {
                    await Order.findOneAndUpdate(
                        { userId: user._id, status: 'pending', paymentStatus: 'pending' },
                        { $set: { status: 'failed', paymentStatus: 'failed', failedAt: new Date() } }
                    );
                }
                break;
            }

            // ── Invoice payment succeeded (renewals) ─────────────────────────
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const user = await User.findOne({ stripeCustomerId: customerId }).select('_id name email').lean();
                if (!user) break;

                // Get subscription info
                const subscriptionId = invoice.subscription as string;
                const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
                const planId = (stripeSub as any).metadata?.planId as PlanId | undefined;
                const plan: SubscriptionPlan | undefined = planId ? PLAN_MAP.get(planId) : undefined;

                if (!plan) break;

                // Create order for renewal
                const orderNumber = generateOrderNumber();
                await Order.create({
                    orderNumber,
                    userId: user._id,
                    customerName: user.name,
                    customerEmail: user.email,
                    items: [{
                        name: plan.name,
                        description: `${plan.durationMonths} month subscription (Renewal)`,
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
                        method: 'card',
                        provider: 'stripe',
                        stripePaymentIntentId: (invoice as any).payment_intent as string,
                    },
                    stripeCustomerId: customerId,
                    subscriptionId,
                    planId,
                    completedAt: new Date(),
                });

                // Create transaction for renewal
                await Transaction.create({
                    transactionNumber: generateTransactionNumber(),
                    userId: user._id,
                    type: 'debit',
                    amount: plan.priceAmount,
                    currency: 'USD',
                    description: `Subscription Renewal: ${plan.name}`,
                    status: 'completed',
                    paymentMethod: 'card',
                    provider: 'stripe',
                    stripePaymentIntentId: (invoice as any).payment_intent as string,
                    completedAt: new Date(),
                });

                console.log(`✅  Stripe: renewal payment succeeded for user ${user._id} — plan ${planId}`);
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
