/**
 * Single source of truth for all subscription plans.
 * Prices are in cents (EUR). stripe.Price IDs are read from env vars.
 *
 * To add a real Stripe product/price:
 *   1. Create a Recurring Price in the Stripe Dashboard.
 *   2. Set STRIPE_GOLD_1M_PRICE_ID=price_xxx (etc.) in .env.local
 *   3. The purchase flow will create Checkout Sessions using these IDs.
 */

export type PlanId = 'gold_1m' | 'gold_3m' | 'gold_6m';
export type PlanTier = 'free' | 'premium' | 'gold';

export interface SubscriptionPlan {
    id: PlanId;
    tier: PlanTier;
    name: string;
    durationMonths: number;
    /** Total price in cents */
    priceAmount: number;
    /** Monthly equivalent price in cents (for display) */
    pricePerMonth: number;
    currency: string;
    savingPercent?: number;
    highlight?: boolean;
}

export const PLANS: SubscriptionPlan[] = [
    {
        id: 'gold_1m',
        tier: 'gold',
        name: '1_month',
        durationMonths: 1,
        priceAmount: 2999,
        pricePerMonth: 2999,
        currency: 'eur',
    },
    {
        id: 'gold_3m',
        tier: 'gold',
        name: '3_months',
        durationMonths: 3,
        priceAmount: 5999,
        pricePerMonth: 1999,
        currency: 'eur',
        savingPercent: 33,
    },
    {
        id: 'gold_6m',
        tier: 'gold',
        name: '6_months',
        durationMonths: 6,
        priceAmount: 8999,
        pricePerMonth: 1499,
        currency: 'eur',
        savingPercent: 50,
        highlight: true,
    },
];

export const PLAN_MAP = new Map<PlanId, SubscriptionPlan>(PLANS.map((p) => [p.id, p]));

// ─── Feature access per tier ──────────────────────────────────────────────────

export interface PlanFeatures {
    dailySwipes: number;         // -1 = unlimited
    dailySuperlikes: number;
    seeWhoLiked: boolean;
    advancedFilters: boolean;
    readReceipts: boolean;
    unlimitedSuperlikes: boolean;
    boostProfile: boolean;
    priorityMatching: boolean;
    noAds: boolean;
}

export const TIER_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    dailySwipes: 10,
    dailySuperlikes: 1,
    seeWhoLiked: false,
    advancedFilters: false,
    readReceipts: false,
    unlimitedSuperlikes: false,
    boostProfile: false,
    priorityMatching: false,
    noAds: false,
  },
  premium: {
    dailySwipes: -1,
    dailySuperlikes: 5,
    seeWhoLiked: true,
    advancedFilters: true,
    readReceipts: true,
    unlimitedSuperlikes: false,
    boostProfile: false,
    priorityMatching: false,
    noAds: true,
  },
  gold: {
    dailySwipes: -1,
    dailySuperlikes: -1,
    seeWhoLiked: true,
    advancedFilters: true,
    readReceipts: true,
    unlimitedSuperlikes: true,
    boostProfile: true,
    priorityMatching: true,
    noAds: true,
  },
};

export function getFeaturesForUser(subscription?: {
    plan?: PlanTier;
    isActive?: boolean;
}): PlanFeatures {
    const tier = subscription?.isActive && subscription.plan
        ? subscription.plan
        : 'free';
    return TIER_FEATURES[tier] ?? TIER_FEATURES.free;
}

/** Format a price in cents as a localised currency string */
export function formatPrice(amountCents: number, currency = 'eur'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
    }).format(amountCents / 100);
}
