import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Swipe } from '@/lib/db/models/Swipe';
import { Order } from '@/lib/db/models/Order';
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
        const totalUsers = await User.countDocuments({ role: 'user', isOnboarded: true });
        
        // New users in period
        const newUsers = await User.countDocuments({
            role: 'user', isOnboarded: true,
            createdAt: { $gte: startDate }
        });

        // Previous period for comparison
        const prevStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        const prevNewUsers = await User.countDocuments({
            role: 'user', isOnboarded: true,
            createdAt: { $gte: prevStartDate, $lt: startDate }
        });

        // Active users (users active in last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            role: 'user', isOnboarded: true,
            lastActive: { $gte: thirtyDaysAgo }
        });

        // Admin count
        const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'moderator'] } });

        // Subscription stats: count distinct users with completed orders
        const premiumUserIds = await Order.distinct('userId', {
            status: 'completed',
            paymentStatus: 'paid',
        });
        const premiumUsers = premiumUserIds.length;

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
            { $match: { role: 'user', isOnboarded: true } },
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
                totalAdmins,
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

// Helper function to calculate revenue from actual completed orders
async function calculateRevenue(startDate: Date, endDate: Date): Promise<number> {
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
            },
        },
    ]);

    // total is stored in cents, convert to euros
    return (result[0]?.revenue || 0) / 100;
}

// Helper function to get daily growth
async function getDailyGrowth(startDate: Date, endDate: Date): Promise<Array<{ date: string; users: number; revenue: number }>> {
    // Aggregate daily user registrations
    const userGrowth = await User.aggregate([
        { $match: { role: 'user', isOnboarded: true, createdAt: { $gte: startDate, $lt: endDate } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
    ]);

    // Aggregate daily revenue from completed orders
    const revenueGrowth = await Order.aggregate([
        {
            $match: {
                status: 'completed',
                paymentStatus: 'paid',
                completedAt: { $gte: startDate, $lt: endDate },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
                revenue: { $sum: '$total' },
            },
        },
    ]);

    const userMap = new Map(userGrowth.map((d) => [d._id, d.count]));
    const revenueMap = new Map(revenueGrowth.map((d) => [d._id, d.revenue]));

    const days: Array<{ date: string; users: number; revenue: number }> = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        days.push({
            date: dateStr,
            users: userMap.get(dateStr) || 0,
            revenue: ((revenueMap.get(dateStr) || 0) / 100), // cents to euros
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
}
