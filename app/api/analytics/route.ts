import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Swipe } from '@/lib/db/models/Swipe';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/dashboard ────────────────────────────────────────────────

/**
 * GET /api/analytics/dashboard
 * Returns dashboard overview: total users, revenue, active subscriptions, growth stats
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // Check authentication and admin role
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Total users
        const totalUsers = await User.countDocuments({ role: 'user' });
        
        // New users in period
        const newUsers = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: startDate }
        });

        // Previous period for comparison
        const prevStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        const prevNewUsers = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: prevStartDate, $lt: startDate }
        });

        // Active users (users active in last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            role: 'user',
            lastActive: { $gte: thirtyDaysAgo }
        });

        // Subscription stats
        const premiumUsers = await User.countDocuments({
            'subscription.isActive': true,
            'subscription.plan': { $in: ['premium', 'gold'] }
        });

        const freeUsers = totalUsers - premiumUsers;

        // Revenue calculation (estimated from subscription data)
        // In production, this would come from Stripe
        const subscriptionRevenue = await calculateRevenue(startDate, now);
        
        // Previous period revenue
        const prevRevenue = await calculateRevenue(prevStartDate, startDate);

        // Growth percentage
        const userGrowth = prevNewUsers > 0 
            ? Math.round(((newUsers - prevNewUsers) / prevNewUsers) * 100) 
            : 0;
        
        const revenueGrowth = prevRevenue > 0 
            ? Math.round(((subscriptionRevenue - prevRevenue) / prevRevenue) * 100) 
            : 0;

        // Match stats
        const totalMatches = await Match.countDocuments();
        const newMatches = await Match.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Message stats
        const totalMessages = await Message.countDocuments();
        const newMessages = await Message.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Swipe stats
        const totalSwipes = await Swipe.countDocuments();
        const newSwipes = await Swipe.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Engagement rate
        const engagementRate = totalUsers > 0 
            ? Math.round((activeUsers / totalUsers) * 100) 
            : 0;

        // Gender distribution
        const genderStats = await User.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: '$gender', count: { $sum: 1 } } }
        ]);

        const maleCount = genderStats.find(g => g._id === 'male')?.count || 0;
        const femaleCount = genderStats.find(g => g._id === 'female')?.count || 0;

        // Daily growth for the period
        const dailyGrowth = await getDailyGrowth(startDate, now);

        return NextResponse.json({
            success: true,
            overview: {
                totalUsers,
                newUsers,
                activeUsers,
                premiumUsers,
                freeUsers,
                totalMatches,
                newMatches,
                totalMessages,
                newMessages,
                totalSwipes,
                newSwipes,
                revenue: subscriptionRevenue,
                engagementRate,
                genderDistribution: {
                    male: maleCount,
                    female: femaleCount
                },
                growth: {
                    users: userGrowth,
                    revenue: revenueGrowth
                }
            },
            dailyGrowth,
            period
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to calculate revenue
async function calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
    // Get users who had active subscriptions in the period
    const usersWithSubscriptions = await User.find({
        'subscription.isActive': true,
        'subscription.plan': { $in: ['premium', 'gold'] }
    }).select('subscription').lean();

    // Calculate estimated revenue based on plan prices
    // In production, this would be fetched from Stripe
    const planPrices: Record<string, number> = {
        premium: 9.99, // monthly
        gold: 19.99    // monthly
    };

    let monthlyRevenue = 0;
    for (const user of usersWithSubscriptions) {
        if (user.subscription?.plan && planPrices[user.subscription.plan]) {
            monthlyRevenue += planPrices[user.subscription.plan];
        }
    }

    // Calculate months in period
    const monthsDiff = (endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    
    return Math.round(monthlyRevenue * Math.max(0.5, monthsDiff) * 100) / 100;
}

// Helper function to get daily growth
async function getDailyGrowth(startDate: Date, endDate: Date): Promise<Array<{ date: string; users: number; revenue: number }>> {
    const days: Array<{ date: string; users: number; revenue: number }> = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        
        const userCount = await User.countDocuments({
            role: 'user',
            createdAt: { $gte: dayStart, $lt: dayEnd }
        });

        days.push({
            date: currentDate.toISOString().split('T')[0],
            users: userCount,
            revenue: 0 // Would be calculated from actual payments
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
}
