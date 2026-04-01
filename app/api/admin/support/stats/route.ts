import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ticket } from '@/lib/db/models/Ticket';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/support/stats ───────────────────────────────────────────────

/**
 * GET /api/admin/support/stats
 * Get support statistics
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // Get counts by status
        const statusBreakdown = await Ticket.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get counts by priority
        const priorityBreakdown = await Ticket.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                },
            },
        ]);

        // Get total tickets
        const totalTickets = await Ticket.countDocuments();

        // Get tickets created today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const ticketsCreatedToday = await Ticket.countDocuments({
            createdAt: { $gte: startOfDay },
        });

        // Get tickets closed today
        const ticketsClosedToday = await Ticket.countDocuments({
            closedAt: { $gte: startOfDay },
        });

        // Calculate average response time (time between first message and first admin reply)
        const ticketsWithAdminReply = await Ticket.find({
            'messages.sender': 'admin',
        }).lean();

        let totalResponseTime = 0;
        let ticketsWithResponse = 0;

        for (const ticket of ticketsWithAdminReply) {
             
            const firstUserMessage = ticket.messages.find((m: any) => m.sender === 'user');
             
            const firstAdminMessage = ticket.messages.find((m: any) => m.sender === 'admin');

            if (firstUserMessage && firstAdminMessage) {
                const responseTime = new Date(firstAdminMessage.timestamp).getTime() - new Date(firstUserMessage.timestamp).getTime();
                totalResponseTime += responseTime;
                ticketsWithResponse++;
            }
        }

        const avgResponseTimeMs = ticketsWithResponse > 0 ? totalResponseTime / ticketsWithResponse : 0;
        const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);

        // Format breakdown
        const statusMap: Record<string, number> = {};
        statusBreakdown.forEach(s => {
            statusMap[s._id] = s.count;
        });

        const priorityMap: Record<string, number> = {};
        priorityBreakdown.forEach(p => {
            priorityMap[p._id] = p.count;
        });

        return NextResponse.json({
            success: true,
            stats: {
                overview: {
                    totalTickets,
                    ticketsCreatedToday,
                    ticketsClosedToday,
                },
                statusBreakdown: statusMap,
                priorityBreakdown: priorityMap,
                avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
            },
        });
    } catch (error) {
        console.error('Admin get support stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
