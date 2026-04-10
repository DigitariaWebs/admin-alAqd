import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { Swipe } from '@/lib/db/models/Swipe';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/engagement ────────────────────────────────────────────────

/**
 * GET /api/analytics/engagement
 * Returns user engagement metrics
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d';

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
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Basic engagement metrics
        const [
            totalUsers,
            activeUsersLast30Days,
            activeUsersLast7Days,
            activeUsersToday,
            totalSwipes,
            periodSwipes,
            totalMessages,
            periodMessages,
            totalMatches,
            periodMatches
        ] = await Promise.all([
            // Total users
            User.countDocuments({ role: 'user', isOnboarded: true }),
            
            // Active users in last 30 days
            User.countDocuments({
                role: 'user',
                isOnboarded: true,
                lastActive: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
            }),
            
            // Active users in last 7 days
            User.countDocuments({
                role: 'user',
                isOnboarded: true,
                lastActive: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
            }),
            
            // Active users today
            User.countDocuments({
                role: 'user',
                isOnboarded: true,
                lastActive: { $gte: new Date(now.setHours(0, 0, 0, 0)) }
            }),
            
            // Total swipes
            Swipe.countDocuments(),
            
            // Swipes in period
            Swipe.countDocuments({ createdAt: { $gte: startDate } }),
            
            // Total messages
            Message.countDocuments(),
            
            // Messages in period
            Message.countDocuments({ createdAt: { $gte: startDate } }),
            
            // Total matches
            Match.countDocuments(),
            
            // Matches in period
            Match.countDocuments({ createdAt: { $gte: startDate } })
        ]);

        // Calculate engagement rates
        const dau = activeUsersToday;
        const mau = activeUsersLast30Days;
        const engagementRate30d = mau > 0 ? Math.round((dau / mau) * 100) : 0;
        const stickiness = totalUsers > 0 ? Math.round((mau / totalUsers) * 100) : 0;

        // Average messages per user
        const avgMessagesPerUser = totalUsers > 0 ? Math.round((totalMessages / totalUsers) * 10) / 10 : 0;
        
        // Average swipes per user
        const avgSwipesPerUser = totalUsers > 0 ? Math.round((totalSwipes / totalUsers) * 10) / 10 : 0;

        // Match rate (likes that resulted in matches)
        const likesCount = await Swipe.countDocuments({ action: 'like', createdAt: { $gte: startDate } });
        const matchRate = likesCount > 0 ? Math.round((periodMatches / likesCount) * 1000) / 10 : 0;

        // Conversion funnel
        const usersWithPhotos = await User.countDocuments({
            role: 'user',
            isOnboarded: true,
            photos: { $exists: true, $ne: [] }
        });

        const usersWithBio = await User.countDocuments({
            role: 'user',
            isOnboarded: true,
            bio: { $exists: true, $ne: '' }
        });

        const onboardedUsers = await User.countDocuments({
            role: 'user',
            isOnboarded: true
        });

        // Daily engagement trend
        const dailyEngagement = await getDailyEngagement(startDate, now);

        // Engagement by user segment
        const engagementBySegment = await getEngagementBySegment(startDate);

        // Top active users
        const topActiveUsers = await User.find({ role: 'user', isOnboarded: true })
            .sort({ lastActive: -1 })
            .limit(10)
            .select('name email lastActive')
            .lean();

        return NextResponse.json({
            success: true,
            overview: {
                dailyActiveUsers: dau,
                weeklyActiveUsers: activeUsersLast7Days,
                monthlyActiveUsers: mau,
                totalUsers,
                engagementRate: engagementRate30d,
                stickiness,
                avgMessagesPerUser,
                avgSwipesPerUser,
                matchRate,
                likesCount: periodSwipes,
                messagesCount: periodMessages,
                matchesCount: periodMatches
            },
            conversionFunnel: {
                totalUsers,
                withPhotos: usersWithPhotos,
                withBio: usersWithBio,
                onboarded: onboardedUsers,
                photoRate: totalUsers > 0 ? Math.round((usersWithPhotos / totalUsers) * 100) : 0,
                bioRate: totalUsers > 0 ? Math.round((usersWithBio / totalUsers) * 100) : 0,
                onboardingRate: totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0
            },
            dailyEngagement,
            engagementBySegment,
            topActiveUsers: topActiveUsers.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                lastActive: u.lastActive
            })),
            period
        });

    } catch (error) {
        console.error('Engagement analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function getDailyEngagement(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    activeUsers: number;
    messages: number;
    swipes: number;
    matches: number;
}>> {
    const days: Array<{
        date: string;
        activeUsers: number;
        messages: number;
        swipes: number;
        matches: number;
    }> = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        const dayEnd = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        dayEnd.setDate(currentDate.getDate() + 1);
        
        const [activeUsers, messages, swipes, matches] = await Promise.all([
            User.countDocuments({
                role: 'user',
                isOnboarded: true,
                lastActive: { $gte: dayStart, $lt: dayEnd }
            }),
            Message.countDocuments({
                createdAt: { $gte: dayStart, $lt: dayEnd }
            }),
            Swipe.countDocuments({
                createdAt: { $gte: dayStart, $lt: dayEnd }
            }),
            Match.countDocuments({
                createdAt: { $gte: dayStart, $lt: dayEnd }
            })
        ]);

        days.push({
            date: currentDate.toISOString().split('T')[0],
            activeUsers,
            messages,
            swipes,
            matches
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
}

async function getEngagementBySegment(startDate: Date): Promise<Array<{
    segment: string;
    users: number;
    activeUsers: number;
    engagementRate: number;
}>> {
    const segments = [];

    // By subscription status
    const [premiumUsers, premiumActive] = await Promise.all([
        User.countDocuments({ 'subscription.plan': { $in: ['premium', 'gold'] } }),
        User.countDocuments({
            'subscription.plan': { $in: ['premium', 'gold'] },
            lastActive: { $gte: startDate }
        })
    ]);
    
    segments.push({
        segment: 'Premium',
        users: premiumUsers,
        activeUsers: premiumActive,
        engagementRate: premiumUsers > 0 ? Math.round((premiumActive / premiumUsers) * 100) : 0
    });

    const [freeUsers, freeActive] = await Promise.all([
        User.countDocuments({ 
            $or: [
                { 'subscription.plan': 'free' },
                { subscription: { $exists: false } }
            ]
        }),
        User.countDocuments({
            $or: [
                { 'subscription.plan': 'free' },
                { subscription: { $exists: false } }
            ],
            lastActive: { $gte: startDate }
        })
    ]);

    segments.push({
        segment: 'Free',
        users: freeUsers,
        activeUsers: freeActive,
        engagementRate: freeUsers > 0 ? Math.round((freeActive / freeUsers) * 100) : 0
    });

    // By gender
    const [maleUsers, maleActive] = await Promise.all([
        User.countDocuments({ role: 'user', isOnboarded: true, gender: 'male' }),
        User.countDocuments({
            role: 'user',
            isOnboarded: true,
            gender: 'male',
            lastActive: { $gte: startDate }
        })
    ]);

    segments.push({
        segment: 'Male',
        users: maleUsers,
        activeUsers: maleActive,
        engagementRate: maleUsers > 0 ? Math.round((maleActive / maleUsers) * 100) : 0
    });

    const [femaleUsers, femaleActive] = await Promise.all([
        User.countDocuments({ role: 'user', isOnboarded: true, gender: 'female' }),
        User.countDocuments({
            role: 'user',
            isOnboarded: true,
            gender: 'female',
            lastActive: { $gte: startDate }
        })
    ]);

    segments.push({
        segment: 'Female',
        users: femaleUsers,
        activeUsers: femaleActive,
        engagementRate: femaleUsers > 0 ? Math.round((femaleActive / femaleUsers) * 100) : 0
    });

    return segments;
}
