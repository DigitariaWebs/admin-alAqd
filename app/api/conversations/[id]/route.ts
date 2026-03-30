import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/conversations/:id
 * Hides the conversation for the current user by adding them to deletedBy.
 * The match stays active so it won't reappear in likes/discover.
 * Messages are preserved.
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
            {
                $addToSet: { deletedBy: authResult.user.userId },
                $set: { [`clearedAt.${authResult.user.userId}`]: new Date() },
            },
            { new: true }
        );

        if (!match) {
            const exists = await Match.findOne({ _id: id, isActive: true }).select('_id').lean();
            if (exists) {
                return NextResponse.json({ error: 'Guardians cannot delete supervised conversations' }, { status: 403 });
            }
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
