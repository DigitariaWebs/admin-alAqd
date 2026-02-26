import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/reports ────────────────────────────────────────────────

/**
 * GET /api/analytics/reports
 * Generate custom reports
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'summary'; // summary, financial, users, engagement
        const format = searchParams.get('format') || 'json'; // json, csv
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        let reportData: Record<string, unknown>;

        switch (type) {
            case 'financial':
                reportData = await generateFinancialReport(start, end);
                break;
            case 'users':
                reportData = await generateUserReport(start, end);
                break;
            case 'engagement':
                reportData = await generateEngagementReport(start, end);
                break;
            default:
                reportData = await generateSummaryReport(start, end);
        }

        // Generate CSV if requested
        if (format === 'csv') {
            const csv = convertToCSV(reportData);
            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${type}-report-${end.toISOString().split('T')[0]}.csv"`
                }
            });
        }

        return NextResponse.json({
            success: true,
            report: {
                type,
                generatedAt: new Date(),
                dateRange: { start, end },
                data: reportData
            }
        });

    } catch (error) {
        console.error('Reports analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function generateSummaryReport(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    const [
        totalUsers,
        newUsers,
        totalMatches,
        newMatches,
        totalMessages,
        newMessages,
        premiumUsers
    ] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'user', createdAt: { $gte: startDate, $lt: endDate } }),
        Match.countDocuments(),
        Match.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
        Message.countDocuments(),
        Message.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
        User.countDocuments({ 'subscription.plan': { $in: ['premium', 'gold'] } })
    ]);

    return {
        summary: {
            totalUsers,
            newUsers,
            totalMatches,
            newMatches,
            totalMessages,
            newMessages,
            premiumUsers,
            freeUsers: totalUsers - premiumUsers
        },
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        }
    };
}

async function generateFinancialReport(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    const premiumUsers = await User.find({
        'subscription.plan': { $in: ['premium', 'gold'] }
    }).select('subscription name email createdAt').lean();

    const planPrices: Record<string, number> = {
        premium: 9.99,
        gold: 19.99
    };

    let monthlyRevenue = 0;
    const byPlan: Record<string, { count: number; revenue: number }> = {
        premium: { count: 0, revenue: 0 },
        gold: { count: 0, revenue: 0 }
    };

    for (const user of premiumUsers) {
        const plan = user.subscription?.plan || 'premium';
        const price = planPrices[plan] || 0;
        monthlyRevenue += price;
        
        if (byPlan[plan]) {
            byPlan[plan].count++;
            byPlan[plan].revenue += price;
        }
    }

    // Monthly breakdown
    const monthlyBreakdown: Array<{ month: string; revenue: number; newSubscriptions: number }> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const newSubscriptions = await User.countDocuments({
            role: 'user',
            'subscription.plan': { $in: ['premium', 'gold'] },
            'subscription.startDate': { $gte: monthStart, $lt: monthEnd }
        });

        monthlyBreakdown.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            revenue: Math.round(monthlyRevenue * 100) / 100,
            newSubscriptions
        });

        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
        totalMonthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        projectedAnnualRevenue: Math.round(monthlyRevenue * 12 * 100) / 100,
        byPlan,
        monthlyBreakdown,
        currency: 'USD',
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        }
    };
}

async function generateUserReport(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    const users = await User.find({ role: 'user' })
        .select('name email gender nationality createdAt lastActive subscription status')
        .lean();

    const processedUsers = users.map(user => ({
        name: user.name,
        email: user.email,
        gender: user.gender || 'not specified',
        nationality: user.nationality?.[0] || 'not specified',
        subscription: user.subscription?.plan || 'free',
        status: user.status,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        daysSinceActive: user.lastActive 
            ? Math.floor((Date.now() - new Date(user.lastActive).getTime()) / (24 * 60 * 60 * 1000))
            : null
    }));

    // Demographics
    const demographics = {
        byGender: processedUsers.reduce((acc, u) => {
            acc[u.gender] = (acc[u.gender] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        byNationality: processedUsers.reduce((acc, u) => {
            acc[u.nationality] = (acc[u.nationality] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        bySubscription: processedUsers.reduce((acc, u) => {
            acc[u.subscription] = (acc[u.subscription] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    };

    return {
        totalUsers: users.length,
        users: processedUsers,
        demographics,
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        }
    };
}

async function generateEngagementReport(startDate: Date, endDate: Date): Promise<Record<string, unknown>> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        totalUsers,
        activeUsers30d,
        activeUsersPeriod,
        totalMessages,
        messagesPeriod,
        totalMatches,
        matchesPeriod
    ] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        User.countDocuments({
            role: 'user',
            lastActive: { $gte: thirtyDaysAgo }
        }),
        User.countDocuments({
            role: 'user',
            lastActive: { $gte: startDate, $lt: endDate }
        }),
        Message.countDocuments(),
        Message.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } }),
        Match.countDocuments(),
        Match.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } })
    ]);

    return {
        overview: {
            totalUsers,
            activeUsers30Days: activeUsers30d,
            activeUsersPeriod,
            engagementRate: totalUsers > 0 ? Math.round((activeUsers30d / totalUsers) * 100) : 0,
            totalMessages,
            messagesInPeriod: messagesPeriod,
            avgMessagesPerUser: totalUsers > 0 ? Math.round((totalMessages / totalUsers) * 10) / 10 : 0,
            totalMatches,
            matchesInPeriod: matchesPeriod
        },
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        }
    };
}

function convertToCSV(data: Record<string, unknown>): string {
    // Simple CSV conversion for flat data
    if (Array.isArray(data)) {
        if (data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => JSON.stringify((row as Record<string, unknown>)[h] || '')).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
    
    if (typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        return entries.map(([key, value]) => `${key},${JSON.stringify(value)}`).join('\n');
    }
    
    return String(data);
}
