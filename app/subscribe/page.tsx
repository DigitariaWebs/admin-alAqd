import { notFound } from 'next/navigation';
import { verifyWebCheckoutToken } from '@/lib/auth/web-checkout-token';
import { PLANS, formatPrice, type PlanId } from '@/lib/subscription/plans';
import SubscribeClient from './SubscribeClient';

interface PageProps {
    searchParams: Promise<{ token?: string; plan?: string }>;
}

export default async function SubscribePage({ searchParams }: PageProps) {
    const { token, plan } = await searchParams;

    if (!token) notFound();

    const decoded = verifyWebCheckoutToken(token);
    if (!decoded) notFound();

    const planIds: PlanId[] = ['gold_1m', 'gold_3m', 'gold_6m'];
    const initialPlanId: PlanId =
        (plan && planIds.includes(plan as PlanId) && (plan as PlanId)) ||
        decoded.planId ||
        'gold_6m';

    const plans = PLANS.map((p) => ({
        id: p.id,
        name: p.name,
        durationMonths: p.durationMonths,
        priceLabel: formatPrice(p.priceAmount, p.currency),
        pricePerMonthLabel: formatPrice(p.pricePerMonth, p.currency),
        savingPercent: p.savingPercent,
        highlight: p.highlight ?? false,
    }));

    return <SubscribeClient token={token} plans={plans} initialPlanId={initialPlanId} firstName={decoded.firstName} />;
}
