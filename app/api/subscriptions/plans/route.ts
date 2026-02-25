import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { PLANS, formatPrice } from '@/lib/subscription/plans';

/**
 * GET /api/subscriptions/plans
 * Returns all available subscription plans with formatted pricing.
 * Public data — auth not required, but token accepted for consistency.
 */
export async function GET(request: NextRequest) {
    try {
        // Soft auth — don't reject unauthenticated, just continue
        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const plans = PLANS.map((p) => ({
            id:             p.id,
            tier:           p.tier,
            name:           p.name,
            durationMonths: p.durationMonths,
            priceAmount:    p.priceAmount,
            pricePerMonth:  p.pricePerMonth,
            currency:       p.currency,
            savingPercent:  p.savingPercent,
            highlight:      p.highlight ?? false,
            // Formatted labels for display
            priceLabel:        formatPrice(p.priceAmount, p.currency),
            pricePerMonthLabel: formatPrice(p.pricePerMonth, p.currency),
        }));

        return NextResponse.json({ success: true, plans });
    } catch (error) {
        console.error('Get plans error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
