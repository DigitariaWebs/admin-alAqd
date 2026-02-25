import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/conversations/:id
 * Soft-deletes the conversation by marking the match as inactive.
 * Messages are preserved but the conversation disappears from the list.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const match = await Match.findOneAndUpdate(
            {
                _id: id,
                $or: [
                    { user1: authResult.user.userId },
                    { user2: authResult.user.userId },
                ],
                isActive: true,
            },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!match) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
