import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import { Match } from '@/lib/db/models/Match';
import { Message } from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';
import { serializeMessage } from '@/lib/discover/helpers';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/conversations/:id/messages
 *
 * Query params (all optional):
 *   limit  = max messages to return (default 50, max 100)
 *   before = ISO timestamp — return messages older than this (load more / pagination)
 *   after  = ISO timestamp — return messages newer than this (polling for new messages)
 *
 * When neither before nor after is supplied, returns the most recent `limit` messages.
 */
export async function GET(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
        }

        // Verify the user belongs to this conversation
        const match = await Match.findOne({
            _id: id,
            $or: [
                { user1: authResult.user.userId },
                { user2: authResult.user.userId },
            ],
            isActive: true,
        }).lean();

        if (!match) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
        const before = searchParams.get('before');
        const after  = searchParams.get('after');

        const query: Record<string, unknown> = {
            conversationId: new mongoose.Types.ObjectId(id),
            isDeleted: false,
        };

        if (after) {
            query.createdAt = { $gt: new Date(after) };
        } else if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: after ? 1 : -1 }) // ASC for polling, DESC for pagination
            .limit(after ? 200 : limit)           // polling can get many new ones
            .lean();

        // For pagination (DESC) reverse to get chronological order
        const ordered = after ? messages : [...messages].reverse();

        const hasMore = !after && messages.length === limit;

        return NextResponse.json({
            success: true,
            messages: ordered.map(serializeMessage),
            hasMore,
        });
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/conversations/:id/messages
 * Send a new message (text or emoji).
 *
 * Body: { content: string, contentType?: 'text' | 'emoji' }
 */
export async function POST(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
        }

        const match = await Match.findOne({
            _id: id,
            $or: [
                { user1: authResult.user.userId },
                { user2: authResult.user.userId },
            ],
            isActive: true,
        }).lean();

        if (!match) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const body = await request.json();
        const { content, contentType = 'text' } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }
        if (!['text', 'emoji', 'image'].includes(contentType)) {
            return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
        }

        const senderId   = authResult.user.userId;
        const receiverId =
            match.user1.toString() === senderId
                ? match.user2.toString()
                : match.user1.toString();

        const message = await Message.create({
            conversationId: id,
            senderId,
            receiverId,
            content: content.trim(),
            contentType,
        });

        // Update conversation's last-message preview on the Match document
        await Match.updateOne(
            { _id: id },
            {
                $set: {
                    lastMessage: content.trim().substring(0, 100),
                    lastMessageAt: message.createdAt,
                },
            }
        );

        return NextResponse.json({
            success: true,
            message: serializeMessage(message.toObject()),
        });
    } catch (error) {
        console.error('Send message error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
