import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Swipe } from '@/lib/db/models/Swipe';
import { Order } from '@/lib/db/models/Order';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/activities ────────────────────────────────────────────────

/**
 * GET /api/analytics/activities
 * Returns latest system activities
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type'); // user, match, message, swipe, all

        const activities: Array<{
            id: string;
            type: string;
            description: string;
            user?: { id: string; name: string };
            timestamp: Date;
            metadata?: Record<string, unknown>;
        }> = [];

        const recentLimit = Math.min(limit, 50);

        if (!type || type === 'user' || type === 'all') {
            // Recent user registrations
            const recentUsers = await User.find({ role: 'user' })
                .sort({ createdAt: -1 })
                .limit(Math.floor(recentLimit / 5))
                .select('name email createdAt')
                .lean();

            for (const user of recentUsers) {
                activities.push({
                    id: `user-${user._id}`,
                    type: 'user_registration',
                    description: `New user registered: ${user.name}`,
                    user: { id: user._id as string, name: user.name },
                    timestamp: user.createdAt
                });
            }
        }

        if (!type || type === 'match' || type === 'all') {
            // Recent matches
            const recentMatches = await Match.find()
                .sort({ createdAt: -1 })
                .limit(Math.floor(recentLimit / 5))
                .populate('user1', 'name')
                .populate('user2', 'name')
                .lean();

            for (const match of recentMatches) {
                const user1Name = (match as unknown as { user1: { name: string } }).user1?.name || 'User';
                const user2Name = (match as unknown as { user2: { name: string } }).user2?.name || 'User';
                activities.push({
                    id: `match-${match._id}`,
                    type: 'new_match',
                    description: `New match: ${user1Name} & ${user2Name}`,
                    timestamp: match.createdAt,
                    metadata: { matchId: match._id }
                });
            }
        }

        if (!type || type === 'message' || type === 'all') {
            // Recent messages
            const recentMessages = await Message.find()
                .sort({ createdAt: -1 })
                .limit(Math.floor(recentLimit / 5))
                .populate('senderId', 'name')
                .populate('receiverId', 'name')
                .lean();

            for (const msg of recentMessages) {
                const senderName = (msg as unknown as { senderId: { name: string } }).senderId?.name || 'User';
                activities.push({
                    id: `message-${msg._id}`,
                    type: 'new_message',
                    description: `${senderName} sent a message`,
                    timestamp: msg.createdAt,
                    metadata: { messageId: msg._id }
                });
            }
        }

        if (!type || type === 'swipe' || type === 'all') {
            // Recent swipes
            const recentSwipes = await Swipe.find()
                .sort({ createdAt: -1 })
                .limit(Math.floor(recentLimit / 5))
                .populate('fromUser', 'name')
                .populate('toUser', 'name')
                .lean();

            for (const swipe of recentSwipes) {
                const swiperName = (swipe as unknown as { fromUser: { name: string } }).fromUser?.name || 'User';
                const action = swipe.action === 'like' ? 'liked' : swipe.action === 'pass' ? 'passed' : 'superliked';
                activities.push({
                    id: `swipe-${swipe._id}`,
                    type: 'swipe_action',
                    description: `${swiperName} ${action} a profile`,
                    timestamp: swipe.createdAt,
                    metadata: { action: swipe.action }
                });
            }
        }

        if (!type || type === 'subscription' || type === 'all') {
            // Recent subscription purchases
            const recentOrders = await Order.find({
                status: 'completed',
                paymentStatus: 'paid',
                planId: { $exists: true, $ne: null },
            })
                .sort({ completedAt: -1 })
                .limit(Math.floor(recentLimit / 5))
                .select('customerName planId total completedAt orderNumber')
                .lean();

            for (const order of recentOrders) {
                activities.push({
                    id: `subscription-${order._id}`,
                    type: 'subscription_purchase',
                    description: `${order.customerName} subscribed to ${order.planId} (${(order.total / 100).toFixed(2)}€)`,
                    timestamp: order.completedAt || order.createdAt,
                    metadata: { orderNumber: order.orderNumber, planId: order.planId, amount: order.total },
                });
            }
        }

        // Sort all activities by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Return limited results
        const paginatedActivities = activities.slice(0, limit);

        // Get activity counts for summary
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [todayUsers, todayMatches, todayMessages] = await Promise.all([
            User.countDocuments({ role: 'user', createdAt: { $gte: today } }),
            Match.countDocuments({ createdAt: { $gte: today } }),
            Message.countDocuments({ createdAt: { $gte: today } })
        ]);

        return NextResponse.json({
            success: true,
            activities: paginatedActivities,
            summary: {
                today: {
                    newUsers: todayUsers,
                    newMatches: todayMatches,
                    newMessages: todayMessages
                },
                total: activities.length
            },
            limit,
            type: type || 'all'
        });

    } catch (error) {
        console.error('Activities analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
