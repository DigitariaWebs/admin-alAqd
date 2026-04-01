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

        const match = await Match.findOne({
            _id: id,
            isActive: true,
            $or: [
                { user1: authResult.user.userId },
                { user2: authResult.user.userId },
            ],
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

        // Hide messages from before the user cleared the conversation
        const clearedAt = (match as any).clearedAt?.get?.(authResult.user.userId)
            ?? (match as any).clearedAt?.[authResult.user.userId];
        const createdAtFilter: Record<string, Date> = {};
        if (clearedAt) {
            createdAtFilter.$gt = new Date(clearedAt);
        }

        if (after) {
            const afterDate = new Date(after);
            createdAtFilter.$gt = createdAtFilter.$gt && createdAtFilter.$gt > afterDate
                ? createdAtFilter.$gt
                : afterDate;
        } else if (before) {
            createdAtFilter.$lt = new Date(before);
        }

        if (Object.keys(createdAtFilter).length > 0) {
            query.createdAt = createdAtFilter;
        }

        const messages = await Message.find(query)
            .sort({ createdAt: after ? 1 : -1 })
            .limit(after ? 200 : limit)
            .lean();

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
            isActive: true,
            $or: [
                { user1: authResult.user.userId },
                { user2: authResult.user.userId },
            ],
        }).lean();

        if (!match) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const body = await request.json();
        const { content, contentType = 'text' } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }
        if (!['text', 'emoji', 'image', 'call_invite'].includes(contentType)) {
            return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
        }

        const senderId = authResult.user.userId;
        const receiverId = match.user1.toString() === senderId
            ? match.user2.toString()
            : match.user1.toString();

        const message = await Message.create({
            conversationId: id,
            senderId,
            receiverId,
            content: content.trim(),
            contentType,
        });

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
