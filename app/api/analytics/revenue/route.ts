import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Order } from '@/lib/db/models/Order';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/revenue ────────────────────────────────────────────────

/**
 * GET /api/analytics/revenue
 * Returns weekly/monthly revenue data based on actual completed orders.
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'monthly';
        const months = parseInt(searchParams.get('months') || '12');

        const now = new Date();
        const revenueData: Array<{ period: string; revenue: number; subscriptions: number }> = [];

        if (period === 'weekly') {
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const stats = await getRevenueForPeriod(weekStart, weekEnd);
                revenueData.push({
                    period: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    ...stats,
                });
            }
        } else if (period === 'yearly') {
            for (let i = 4; i >= 0; i--) {
                const yearStart = new Date(now.getFullYear() - i, 0, 1);
                const yearEnd = new Date(now.getFullYear() - i + 1, 0, 1);

                const stats = await getRevenueForPeriod(yearStart, yearEnd);
                revenueData.push({
                    period: `${yearStart.getFullYear()}`,
                    ...stats,
                });
            }
        } else {
            for (let i = months - 1; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

                const stats = await getRevenueForPeriod(monthStart, monthEnd);
                revenueData.push({
                    period: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    ...stats,
                });
            }
        }

        // Totals
        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
        const totalSubscriptions = revenueData.reduce((sum, d) => sum + d.subscriptions, 0);
        const averageRevenue = totalRevenue / revenueData.length || 0;

        // Growth
        const currentPeriod = revenueData[revenueData.length - 1]?.revenue || 0;
        const previousPeriod = revenueData[revenueData.length - 2]?.revenue || 0;
        const growthPercentage = previousPeriod > 0
            ? Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100)
            : 0;

        // Revenue by plan
        const revenueByPlan = await getRevenueByPlan();

        return NextResponse.json({
            success: true,
            revenueData,
            summary: {
                totalRevenue: Math.round(totalRevenue) / 100,
                averageRevenue: Math.round(averageRevenue) / 100,
                totalSubscriptions,
                growthPercentage,
            },
            revenueByPlan,
            period,
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function getRevenueForPeriod(startDate: Date, endDate: Date) {
    const result = await Order.aggregate([
        {
            $match: {
                status: 'completed',
                paymentStatus: 'paid',
                completedAt: { $gte: startDate, $lt: endDate },
            },
        },
        {
            $group: {
                _id: null,
                revenue: { $sum: '$total' },
                count: { $sum: 1 },
            },
        },
    ]);

    return {
        revenue: result[0]?.revenue || 0,
        subscriptions: result[0]?.count || 0,
    };
}

async function getRevenueByPlan() {
    const result = await Order.aggregate([
        {
            $match: {
                status: 'completed',
                paymentStatus: 'paid',
                planId: { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: '$planId',
                count: { $sum: 1 },
                revenue: { $sum: '$total' },
            },
        },
        { $sort: { revenue: -1 } },
    ]);

    return result.map((r) => ({
        plan: r._id,
        count: r.count,
        revenue: r.revenue,
    }));
}
