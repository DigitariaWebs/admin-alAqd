import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ticket } from '@/lib/db/models/Ticket';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/support/tickets/[id] ─────────────────────────────────────────

/**
 * GET /api/admin/support/tickets/[id]
 * Get ticket details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            ticket: {
                id: ticket._id.toString(),
                ticketNumber: ticket.ticketNumber,
                userId: ticket.userId,
                userName: ticket.userName,
                userEmail: ticket.userEmail,
                subject: ticket.subject,
                description: ticket.description,
                priority: ticket.priority,
                status: ticket.status,
                category: ticket.category,
                messages: ticket.messages,
                assignedTo: ticket.assignedTo,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
                closedAt: ticket.closedAt,
            },
        });
    } catch (error) {
        console.error('Admin get ticket error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PATCH /api/admin/support/tickets/[id] ─────────────────────────────────────────

/**
 * PATCH /api/admin/support/tickets/[id]
 * Update ticket status
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, priority, assignedTo } = body;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        if (status) ticket.status = status;
        if (priority) ticket.priority = priority;
        if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

        if (status === 'closed') {
            ticket.closedAt = new Date();
        }

        await ticket.save();

        return NextResponse.json({
            success: true,
            message: 'Ticket updated successfully',
            ticket: {
                id: ticket._id.toString(),
                ticketNumber: ticket.ticketNumber,
                status: ticket.status,
                priority: ticket.priority,
                assignedTo: ticket.assignedTo,
                closedAt: ticket.closedAt,
            },
        });
    } catch (error) {
        console.error('Admin update ticket error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
