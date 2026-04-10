import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/analytics/user-growth ────────────────────────────────────────────────

/**
 * GET /api/analytics/user-growth
 * Returns user growth over time with various metrics
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly
        const months = parseInt(searchParams.get('months') || '12');

        const now = new Date();
        const growthData: Array<{
            period: string;
            totalUsers: number;
            newUsers: number;
            activeUsers: number;
            maleUsers: number;
            femaleUsers: number;
        }> = [];

        if (period === 'daily') {
            // Get daily data for the past 30 days
            for (let i = 29; i >= 0; i--) {
                const dayStart = new Date(now);
                dayStart.setDate(now.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);
                
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayStart.getDate() + 1);

                const [newUsers, totalUsers, activeUsers, maleUsers, femaleUsers] = await Promise.all([
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        createdAt: { $gte: dayStart, $lt: dayEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        createdAt: { $lt: dayEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        lastActive: { $gte: dayStart }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        gender: 'male',
                        createdAt: { $lt: dayEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        gender: 'female',
                        createdAt: { $lt: dayEnd }
                    })
                ]);

                growthData.push({
                    period: dayStart.toISOString().split('T')[0],
                    totalUsers,
                    newUsers,
                    activeUsers,
                    maleUsers,
                    femaleUsers
                });
            }
        } else if (period === 'weekly') {
            // Get weekly data for the past 12 weeks
            for (let i = 11; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);

                const [newUsers, totalUsers, activeUsers, maleUsers, femaleUsers] = await Promise.all([
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        createdAt: { $gte: weekStart, $lt: weekEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        createdAt: { $lt: weekEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        lastActive: { $gte: weekStart }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        gender: 'male',
                        createdAt: { $lt: weekEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        gender: 'female',
                        createdAt: { $lt: weekEnd }
                    })
                ]);

                growthData.push({
                    period: `W${Math.ceil((now.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
                    totalUsers,
                    newUsers,
                    activeUsers,
                    maleUsers,
                    femaleUsers
                });
            }
        } else {
            // Default: monthly data
            for (let i = months - 1; i >= 0; i--) {
                const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

                const [newUsers, totalUsers, activeUsers, maleUsers, femaleUsers] = await Promise.all([
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        createdAt: { $gte: monthStart, $lt: monthEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        createdAt: { $lt: monthEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        lastActive: { $gte: monthStart }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        gender: 'male',
                        createdAt: { $lt: monthEnd }
                    }),
                    User.countDocuments({
                        role: 'user',
                        isOnboarded: true,
                        gender: 'female',
                        createdAt: { $lt: monthEnd }
                    })
                ]);

                growthData.push({
                    period: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                    totalUsers,
                    newUsers,
                    activeUsers,
                    maleUsers,
                    femaleUsers
                });
            }
        }

        // Calculate growth rates
        const firstPeriod = growthData[0];
        const lastPeriod = growthData[growthData.length - 1];
        
        const totalGrowth = firstPeriod.totalUsers > 0
            ? Math.round(((lastPeriod.totalUsers - firstPeriod.totalUsers) / firstPeriod.totalUsers) * 100)
            : 0;

        const activeGrowth = firstPeriod.activeUsers > 0
            ? Math.round(((lastPeriod.activeUsers - firstPeriod.activeUsers) / firstPeriod.activeUsers) * 100)
            : 0;

        // Average new users per period
        const avgNewUsers = Math.round(
            growthData.reduce((sum, d) => sum + d.newUsers, 0) / growthData.length
        );

        // Projections (simple linear)
        const recentGrowthRate = growthData.length > 1
            ? growthData[growthData.length - 1].newUsers - growthData[growthData.length - 2].newUsers
            : 0;
        
        const projectedUsers = lastPeriod.totalUsers + recentGrowthRate * (period === 'daily' ? 30 : period === 'weekly' ? 4 : 1);

        return NextResponse.json({
            success: true,
            growthData,
            summary: {
                currentTotal: lastPeriod.totalUsers,
                currentActive: lastPeriod.activeUsers,
                totalGrowth,
                activeGrowth,
                averageNewUsers: avgNewUsers,
                projectedUsers: Math.round(projectedUsers)
            },
            period
        });

    } catch (error) {
        console.error('User growth analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
