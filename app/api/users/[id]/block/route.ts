import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Block } from '@/lib/db/models/Block';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/users/:id/block
 * Block a user. Also deactivates any existing match between them.
 */
export async function POST(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id: targetId } = await params;

        if (targetId === authResult.user.userId) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
        }

        // Create block record (idempotent — ignore if already blocked)
        await Block.findOneAndUpdate(
            { blockerId: authResult.user.userId, blockedId: targetId },
            { $setOnInsert: { blockerId: authResult.user.userId, blockedId: targetId } },
            { upsert: true }
        );

        // Deactivate any active match between the two users
        const [u1, u2] = [authResult.user.userId, targetId].sort();
        await Match.updateOne(
            { user1: u1, user2: u2, isActive: true },
            { $set: { isActive: false } }
        );

        return NextResponse.json({ success: true, message: 'User blocked' });
    } catch (error) {
        console.error('Block user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/users/:id/block
 * Unblock a previously blocked user.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id: targetId } = await params;

        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
        }

        const result = await Block.deleteOne({
            blockerId: authResult.user.userId,
            blockedId: targetId,
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'User unblocked' });
    } catch (error) {
        console.error('Unblock user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
