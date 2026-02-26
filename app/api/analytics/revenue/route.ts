import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/revenue ────────────────────────────────────────────────

/**
 * GET /api/analytics/revenue
 * Returns weekly/monthly revenue data
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'monthly'; // weekly, monthly, yearly
        const months = parseInt(searchParams.get('months') || '12');

        const now = new Date();
        const revenueData: Array<{ period: string; revenue: number; subscriptions: number }> = [];

        if (period === 'weekly') {
            // Get weekly data for the past 12 weeks
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const stats = await getRevenueForPeriod(weekStart, weekEnd);
                revenueData.push({
                    period: `W${Math.ceil((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
                    revenue: stats.revenue,
                    subscriptions: stats.subscriptions
                });
            }
        } else if (period === 'yearly') {
            // Get yearly data for the past 5 years
            for (let i = 4; i >= 0; i--) {
                const yearStart = new Date(now.getFullYear() - i, 0, 1);
                const yearEnd = new Date(now.getFullYear() - i, 11, 31);

                const stats = await getRevenueForPeriod(yearStart, yearEnd);
                revenueData.push({
                    period: `${yearStart.getFullYear()}`,
                    revenue: stats.revenue,
                    subscriptions: stats.subscriptions
                });
            }
        } else {
            // Default: monthly data
            for (let i = months - 1; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

                const stats = await getRevenueForPeriod(monthStart, monthEnd);
                revenueData.push({
                    period: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    revenue: stats.revenue,
                    subscriptions: stats.subscriptions
                });
            }
        }

        // Calculate totals and averages
        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
        const totalSubscriptions = revenueData.reduce((sum, d) => sum + d.subscriptions, 0);
        const averageRevenue = totalRevenue / revenueData.length || 0;

        // Growth calculation
        const previousPeriodRevenue = period === 'weekly' 
            ? revenueData.slice(0, Math.floor(revenueData.length / 2)).reduce((sum, d) => sum + d.revenue, 0)
            : revenueData.slice(0, -1).reduce((sum, d) => sum + d.revenue, 0);
        
        const currentPeriodRevenue = period === 'weekly'
            ? revenueData.slice(Math.floor(revenueData.length / 2)).reduce((sum, d) => sum + d.revenue, 0)
            : revenueData.slice(-1).reduce((sum, d) => sum + d.revenue, 0);

        const growthPercentage = previousPeriodRevenue > 0
            ? Math.round(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
            : 0;

        // Revenue by plan
        const revenueByPlan = await getRevenueByPlan();

        return NextResponse.json({
            success: true,
            revenueData,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                averageRevenue: Math.round(averageRevenue * 100) / 100,
                totalSubscriptions,
                growthPercentage
            },
            revenueByPlan,
            period
        });

    } catch (error) {
        console.error('Revenue analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function getRevenueForPeriod(startDate: Date, endDate: Date): Promise<{ revenue: number; subscriptions: number }> {
    const users = await User.find({
        'subscription.isActive': true,
        'subscription.plan': { $in: ['premium', 'gold'] }
    }).select('subscription').lean();

    const planPrices: Record<string, number> = {
        premium: 9.99,
        gold: 19.99
    };

    let monthlyRevenue = 0;
    for (const user of users) {
        if (user.subscription?.plan && planPrices[user.subscription.plan]) {
            monthlyRevenue += planPrices[user.subscription.plan];
        }
    }

    const monthsInPeriod = (endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    
    return {
        revenue: Math.round(monthlyRevenue * Math.max(0.5, monthsInPeriod) * 100) / 100,
        subscriptions: users.length
    };
}

async function getRevenueByPlan(): Promise<Array<{ plan: string; count: number; revenue: number }>> {
    const plans = ['free', 'premium', 'gold'];
    const result: Array<{ plan: string; count: number; revenue: number }> = [];

    const planPrices: Record<string, number> = {
        free: 0,
        premium: 9.99,
        gold: 19.99
    };

    for (const plan of plans) {
        const count = await User.countDocuments({
            'subscription.plan': plan
        });

        result.push({
            plan,
            count,
            revenue: Math.round(count * (planPrices[plan] || 0) * 100) / 100
        });
    }

    return result;
}
