import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ticket } from '@/lib/db/models/Ticket';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/support/tickets ─────────────────────────────────────────────

/**
 * GET /api/admin/support/tickets
 * List support tickets with filters
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Filters
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        // Build query
        const query: Record<string, unknown> = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { ticketNumber: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } },
            ];
        }

        // Sort
        const sort: Record<string, 1 | -1> = { createdAt: -1 };

        // Execute query
        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Ticket.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            tickets: tickets.map((ticket: any) => ({
                id: String(ticket._id),
                ticketNumber: ticket.ticketNumber,
                userId: ticket.userId,
                userName: ticket.userName,
                userEmail: ticket.userEmail,
                subject: ticket.subject,
                priority: ticket.priority,
                status: ticket.status,
                category: ticket.category,
                messageCount: ticket.messages.length,
                lastMessage: ticket.messages.length > 0 
                    ? ticket.messages[ticket.messages.length - 1].timestamp 
                    : null,
                assignedTo: ticket.assignedTo,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
                closedAt: ticket.closedAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin list tickets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
