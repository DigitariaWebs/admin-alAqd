import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Report, ReportReason } from '@/lib/db/models/Report';
import { Block } from '@/lib/db/models/Block';
import { requireAuth } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

const VALID_REASONS: ReportReason[] = [
    'fake_profile', 'inappropriate_content', 'harassment', 'spam', 'underage', 'other',
];

/**
 * POST /api/users/:id/report
 * Report a user. One report per (reporter, reported) pair — subsequent submissions
 * update the reason/details in place.
 *
 * Body: { reason: ReportReason, details?: string }
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
            return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
        }

        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
        }

        const body = await request.json();
        const { reason, details } = body;

        if (!reason || !VALID_REASONS.includes(reason)) {
            return NextResponse.json(
                { error: `reason must be one of: ${VALID_REASONS.join(', ')}` },
                { status: 400 }
            );
        }

        if (details && typeof details === 'string' && details.length > 500) {
            return NextResponse.json({ error: 'details must be ≤500 characters' }, { status: 400 });
        }

        await Report.findOneAndUpdate(
            { reporterId: authResult.user.userId, reportedId: targetId },
            {
                $set: {
                    reason,
                    details: details?.trim() ?? '',
                    status: 'pending',
                },
                $setOnInsert: {
                    reporterId: authResult.user.userId,
                    reportedId: targetId,
                },
            },
            { upsert: true }
        );

        // Auto-block the reported user
        await Block.findOneAndUpdate(
            { blockerId: authResult.user.userId, blockedId: targetId },
            {
                $setOnInsert: {
                    blockerId: authResult.user.userId,
                    blockedId: targetId,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Report submitted. The user has been blocked.',
        });
    } catch (error) {
        console.error('Report user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
