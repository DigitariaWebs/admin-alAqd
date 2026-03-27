import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Order } from '@/lib/db/models/Order';
import { Transaction } from '@/lib/db/models/Transaction';
import { requireAuth } from '@/lib/auth/middleware';
import { PLAN_MAP, PlanId } from '@/lib/subscription/plans';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
    })
    : null;

function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
}

function generateTransactionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRX-${timestamp}${random}`;
}

/**
 * POST /api/subscriptions/confirm
 * Verifies a subscription's payment status with Stripe and activates it in the DB.
 * Also creates an Order and Transaction record.
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

        const user = await User.findById(authResult.user.userId)
            .select('name email stripeCustomerId stripeSubscriptionId')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Avoid duplicate activation
        if (user.stripeSubscriptionId === subscriptionId) {
            return NextResponse.json({
                success: true,
                subscription: {
                    plan: plan.tier,
                    isActive: true,
                },
            });
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

        // Create Order record
        const orderNumber = generateOrderNumber();
        const order = await Order.create({
            orderNumber,
            userId: authResult.user.userId,
            customerName: user.name,
            customerEmail: user.email,
            items: [{
                name: plan.name,
                description: `${plan.durationMonths} month Gold subscription`,
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
            },
            stripeCustomerId: user.stripeCustomerId,
            subscriptionId,
            planId,
            completedAt: new Date(),
        });

        // Create Transaction record
        await Transaction.create({
            transactionNumber: generateTransactionNumber(),
            orderId: order._id,
            userId: authResult.user.userId,
            type: 'debit',
            amount: plan.priceAmount,
            currency: 'EUR',
            description: `Subscription: ${plan.name}`,
            status: 'completed',
            paymentMethod: 'card',
            provider: 'stripe',
            completedAt: new Date(),
        });

        console.log(`✅ Subscription confirmed for user ${authResult.user.userId} — plan ${planId}, order ${orderNumber}`);

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
