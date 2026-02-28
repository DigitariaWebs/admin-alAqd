import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Notification } from '@/lib/db/models/Notification';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/notifications/stats ───────────────────────────────────────────

/**
 * GET /api/admin/notifications/stats
 * Get notification delivery statistics
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        
        // Date range filters
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const period = searchParams.get('period'); // '7d', '30d', '90d', 'all'

        // Build date filter
        let dateFilter: Record<string, Date> = {};
        const now = new Date();
        
        if (period && period !== 'all') {
            const days = parseInt(period.replace('d', ''));
            dateFilter = {
                $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
            };
        } else if (startDate || endDate) {
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);
        }

        // Query filter
        const query: Record<string, unknown> = {
            status: { $in: ['sent', 'delivered'] }
        };
        
        if (Object.keys(dateFilter).length > 0) {
            query.sentAt = dateFilter;
        }

        // Get overall stats
        const [overallStats, statusBreakdown, typeBreakdown, recentTrend] = await Promise.all([
            // Overall delivery stats
            Notification.aggregate([
                { $match: { status: { $in: ['sent', 'delivered'] } } },
                {
                    $group: {
                        _id: null,
                        totalNotifications: { $sum: 1 },
                        totalRecipients: { $sum: '$deliveryStats.totalRecipients' },
                        totalSent: { $sum: '$deliveryStats.sent' },
                        totalDelivered: { $sum: '$deliveryStats.delivered' },
                        totalFailed: { $sum: '$deliveryStats.failed' },
                        totalOpened: { $sum: '$deliveryStats.opened' },
                        totalClicked: { $sum: '$deliveryStats.clicked' },
                    },
                },
            ]),
            // Status breakdown
            Notification.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            // Type breakdown
            Notification.aggregate([
                { $match: { status: { $in: ['sent', 'delivered'] } } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalRecipients: { $sum: '$deliveryStats.totalRecipients' },
                        totalDelivered: { $sum: '$deliveryStats.delivered' },
                    },
                },
            ]),
            // Recent trend (last 7 days)
            Notification.aggregate([
                {
                    $match: {
                        status: { $in: ['sent', 'delivered'] },
                        sentAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$sentAt' },
                        },
                        notifications: { $sum: 1 },
                        delivered: { $sum: '$deliveryStats.delivered' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        // Get scheduled notifications count
        const scheduledCount = await Notification.countDocuments({
            isScheduled: true,
            status: { $in: ['scheduled', 'draft'] },
        });

        // Get user push notification tokens count (for potential reach)
        const [pushTokenStats] = await Promise.all([
            User.aggregate([
                { $match: { status: 'active' } },
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        premiumUsers: {
                            $sum: { $cond: [{ $in: ['$subscription.plan', ['premium', 'gold']] }, 1, 0] },
                        },
                        freeUsers: {
                            $sum: { $cond: [{ $in: ['$subscription.plan', ['free']] }, 1, 0] },
                        },
                    },
                },
            ]),
        ]);

        const stats = overallStats[0] || {
            totalNotifications: 0,
            totalRecipients: 0,
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            totalOpened: 0,
            totalClicked: 0,
        };

        // Calculate rates
        const deliveryRate = stats.totalSent > 0 
            ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1) 
            : '0';
        const openRate = stats.totalDelivered > 0 
            ? ((stats.totalOpened / stats.totalDelivered) * 100).toFixed(1) 
            : '0';
        const clickRate = stats.totalDelivered > 0 
            ? ((stats.totalClicked / stats.totalDelivered) * 100).toFixed(1) 
            : '0';

        return NextResponse.json({
            success: true,
            stats: {
                overview: {
                    totalNotifications: stats.totalNotifications,
                    totalRecipients: stats.totalRecipients,
                    totalSent: stats.totalSent,
                    totalDelivered: stats.totalDelivered,
                    totalFailed: stats.totalFailed,
                    deliveryRate: parseFloat(deliveryRate),
                    openRate: parseFloat(openRate),
                    clickRate: parseFloat(clickRate),
                },
                statusBreakdown: statusBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {} as Record<string, number>),
                typeBreakdown: typeBreakdown.map(item => ({
                    type: item._id,
                    count: item.count,
                    totalRecipients: item.totalRecipients,
                    totalDelivered: item.totalDelivered,
                })),
                scheduledPending: scheduledCount,
                recentTrend: recentTrend.map(item => ({
                    date: item._id,
                    notifications: item.notifications,
                    delivered: item.delivered,
                })),
                userReach: pushTokenStats[0] || {
                    totalUsers: 0,
                    premiumUsers: 0,
                    freeUsers: 0,
                },
            },
        });
    } catch (error) {
        console.error('Admin notification stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
