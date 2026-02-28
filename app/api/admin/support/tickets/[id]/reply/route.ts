import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ticket } from '@/lib/db/models/Ticket';
import { requireRole } from '@/lib/auth/middleware';

// Helper function to generate unique ID
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ─── POST /api/admin/support/tickets/[id]/reply ───────────────────────────────────

/**
 * POST /api/admin/support/tickets/[id]/reply
 * Reply to ticket
 */
export async function POST(
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
        const { content, attachments } = body;

        if (!content) {
            return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
        }

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        const message = {
            id: generateId(),
            sender: 'admin' as const,
            content,
            timestamp: new Date(),
            attachments: attachments || [],
        };

        ticket.messages.push(message);
        
        // If ticket was closed, reopen it
        if (ticket.status === 'closed') {
            ticket.status = 'open';
            ticket.closedAt = undefined;
        }

        await ticket.save();

        return NextResponse.json({
            success: true,
            message: 'Reply added successfully',
            reply: message,
        });
    } catch (error) {
        console.error('Admin reply to ticket error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
