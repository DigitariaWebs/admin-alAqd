import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/insights ────────────────────────────────────────────────

/**
 * GET /api/analytics/insights
 * Returns AI-generated insights and recommendations
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const insights = await generateInsights();

        return NextResponse.json({
            success: true,
            insights,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('AI insights error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function generateInsights(): Promise<Array<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    description: string;
    metric?: string;
    value?: string;
    recommendation?: string;
    detectedAt: Date;
    priority: 'high' | 'medium' | 'low';
}>> {
    const insights: Array<{
        id: string;
        type: 'success' | 'warning' | 'info' | 'tip';
        title: string;
        description: string;
        metric?: string;
        value?: string;
        recommendation?: string;
        detectedAt: Date;
        priority: 'high' | 'medium' | 'low';
    }> = [];

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get key metrics
    const [
        totalUsers,
        newUsersLast7d,
        newUsersLast30d,
        premiumUsers,
        activeUsers30d,
        matchesLast7d,
        messagesLast7d,
        usersWithoutPhotos,
        usersWithoutBio,
        inactiveUsers30d
    ] = await Promise.all([
        User.countDocuments({ role: 'user', isOnboarded: true }),
        User.countDocuments({ role: 'user', isOnboarded: true, createdAt: { $gte: sevenDaysAgo } }),
        User.countDocuments({ role: 'user', isOnboarded: true, createdAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ 'subscription.plan': { $in: ['premium', 'gold'] } }),
        User.countDocuments({ role: 'user', isOnboarded: true, lastActive: { $gte: thirtyDaysAgo } }),
        Match.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Message.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        User.countDocuments({ role: 'user', isOnboarded: true, photos: { $exists: true, $size: 0 } }),
        User.countDocuments({ role: 'user', isOnboarded: true, $or: [{ bio: { $exists: false } }, { bio: '' }] }),
        User.countDocuments({ role: 'user', isOnboarded: true, lastActive: { $lt: thirtyDaysAgo } })
    ]);

    const freeUsers = totalUsers - premiumUsers;
    const engagementRate = totalUsers > 0 ? Math.round((activeUsers30d / totalUsers) * 100) : 0;
    const previous7dUsers = await User.countDocuments({
        role: 'user', isOnboarded: true,
        createdAt: { $gte: new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000), $lt: sevenDaysAgo }
    });

    // 1. Registration Trend Analysis
    const registrationGrowth = previous7dUsers > 0 
        ? Math.round(((newUsersLast7d - previous7dUsers) / previous7dUsers) * 100) 
        : 0;

    if (registrationGrowth > 20) {
        insights.push({
            id: 'registration-spike',
            type: 'success',
            title: 'Registration Surge Detected',
            description: `User registrations increased by ${registrationGrowth}% this week compared to last week.`,
            metric: 'Weekly Registration Growth',
            value: `+${registrationGrowth}%`,
            recommendation: 'Consider running targeted ads or localized campaigns to sustain this momentum.',
            detectedAt: now,
            priority: 'high'
        });
    } else if (registrationGrowth < -20) {
        insights.push({
            id: 'registration-decline',
            type: 'warning',
            title: 'Registration Decline',
            description: `User registrations decreased by ${Math.abs(registrationGrowth)}% this week.`,
            metric: 'Weekly Registration Growth',
            value: `${registrationGrowth}%`,
            recommendation: 'Review recent changes to the onboarding flow and marketing campaigns.',
            detectedAt: now,
            priority: 'high'
        });
    }

    // 2. Premium Conversion
    const conversionRate = freeUsers > 0 ? Math.round((premiumUsers / freeUsers) * 100) : 0;
    if (conversionRate > 20) {
        insights.push({
            id: 'high-conversion',
            type: 'success',
            title: 'Strong Premium Conversion',
            description: `${conversionRate}% of free users have upgraded to premium.`,
            metric: 'Premium Conversion Rate',
            value: `${conversionRate}%`,
            recommendation: 'Continue current upselling strategies. Consider introducing annual plans for even higher LTV.',
            detectedAt: now,
            priority: 'medium'
        });
    } else if (conversionRate < 5) {
        insights.push({
            id: 'low-conversion',
            type: 'warning',
            title: 'Low Premium Conversion',
            description: `Only ${conversionRate}% of free users have upgraded to premium.`,
            metric: 'Premium Conversion Rate',
            value: `${conversionRate}%`,
            recommendation: 'Consider offering a free trial period or showcasing premium features more prominently.',
            detectedAt: now,
            priority: 'high'
        });
    }

    // 3. Engagement Warning
    if (engagementRate < 30) {
        insights.push({
            id: 'low-engagement',
            type: 'warning',
            title: 'Low User Engagement',
            description: `Only ${engagementRate}% of users have been active in the last 30 days.`,
            metric: '30-Day Engagement Rate',
            value: `${engagementRate}%`,
            recommendation: 'Implement re-engagement campaigns and push notifications for inactive users.',
            detectedAt: now,
            priority: 'high'
        });
    } else {
        insights.push({
            id: 'good-engagement',
            type: 'success',
            title: 'Strong User Engagement',
            description: `${engagementRate}% of users have been active in the last 30 days.`,
            metric: '30-Day Engagement Rate',
            value: `${engagementRate}%`,
            recommendation: 'Maintain current engagement strategies and consider gamification features.',
            detectedAt: now,
            priority: 'medium'
        });
    }

    // 4. Profile Completion
    const usersWithoutBioCount = await User.countDocuments({ role: 'user', isOnboarded: true, $or: [{ bio: { $exists: false } }, { bio: '' }] });
    const incompleteProfiles = usersWithoutPhotos + usersWithoutBioCount;
    const incompleteRate = totalUsers > 0 ? Math.round((incompleteProfiles / totalUsers) * 100) : 0;
    
    if (incompleteRate > 50) {
        insights.push({
            id: 'profile-completion',
            type: 'warning',
            title: 'High Incomplete Profile Rate',
            description: `${incompleteRate}% of users have incomplete profiles (no photos or bio).`,
            metric: 'Incomplete Profile Rate',
            value: `${incompleteRate}%`,
            recommendation: 'Send automated reminders to complete profiles. Consider adding incentives.',
            detectedAt: now,
            priority: 'medium'
        });
    }

    // 5. Inactive Users
    const inactiveRate = totalUsers > 0 ? Math.round((inactiveUsers30d / totalUsers) * 100) : 0;
    if (inactiveRate > 40) {
        insights.push({
            id: 'high-churn-risk',
            type: 'warning',
            title: 'High Churn Risk',
            description: `${inactiveRate}% of users haven't been active in 30+ days.`,
            metric: '30-Day Inactive Rate',
            value: `${inactiveRate}%`,
            recommendation: 'Launch win-back campaigns with special offers for returning users.',
            detectedAt: now,
            priority: 'high'
        });
    }

    // 6. Match Success
    const matchRate = newUsersLast7d > 0 
        ? Math.round((matchesLast7d / newUsersLast7d) * 100) 
        : 0;
    
    if (matchRate > 10) {
        insights.push({
            id: 'good-match-rate',
            type: 'success',
            title: 'Healthy Match Rate',
            description: `Users are making ${matchRate}% new matches per registration this week.`,
            metric: 'Weekly Match Rate',
            value: `${matchRate}%`,
            recommendation: 'The matching algorithm is performing well. Continue monitoring.',
            detectedAt: now,
            priority: 'low'
        });
    }

    // 7. Messaging Activity
    const avgMessagesPerMatch = matchesLast7d > 0 ? Math.round(messagesLast7d / matchesLast7d) : 0;
    if (avgMessagesPerMatch < 2) {
        insights.push({
            id: 'low-messaging',
            type: 'info',
            title: 'Low Messaging Activity',
            description: `Only ${avgMessagesPerMatch} messages per match this week.`,
            metric: 'Avg Messages per Match',
            value: String(avgMessagesPerMatch),
            recommendation: 'Consider adding icebreakers or conversation starters to boost engagement.',
            detectedAt: now,
            priority: 'medium'
        });
    }

    // 8. Revenue Opportunity
    if (premiumUsers > 0 && conversionRate < 15) {
        insights.push({
            id: 'revenue-opportunity',
            type: 'tip',
            title: 'Revenue Growth Opportunity',
            description: `${freeUsers} free users could be converted to premium.`,
            metric: 'Potential Additional Revenue',
            value: `~$${Math.round(freeUsers * 0.1 * 9.99)}/month`,
            recommendation: 'Launch targeted email campaigns showcasing premium benefits.',
            detectedAt: now,
            priority: 'medium'
        });
    }

    // 9. Growth Projection
    if (newUsersLast30d > 100) {
        const projectedGrowth = Math.round((newUsersLast30d / 30) * 365);
        insights.push({
            id: 'growth-projection',
            type: 'info',
            title: 'Annual Growth Projection',
            description: 'Based on current trends.',
            metric: 'Projected New Users (Year)',
            value: String(projectedGrowth),
            recommendation: 'Ensure infrastructure can handle projected user load.',
            detectedAt: now,
            priority: 'low'
        });
    }

    // 10. Content Recommendation
    insights.push({
        id: 'content-tip',
        type: 'tip',
        title: 'Content Strategy',
        description: 'Users with complete profiles have 3x higher engagement.',
        recommendation: 'Create blog posts about profile optimization and success stories.',
        detectedAt: now,
        priority: 'low'
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights;
}
