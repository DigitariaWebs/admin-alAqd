import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Notification } from '@/lib/db/models/Notification';
import { requireRole } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// ─── DELETE /api/admin/notifications/[id] ─────────────────────────────────────────

/**
 * DELETE /api/admin/notifications/[id]
 * Delete a scheduled notification or cancel a sent notification
 */
export async function DELETE(
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
        }

        const notification = await Notification.findById(id).lean() as any;

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        // Check if notification can be deleted
        // - Scheduled notifications can always be deleted
        // - Sent notifications can only be deleted by admin
        if (notification.status === 'sent' && authResult.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only admins can delete sent notifications' },
                { status: 403 }
            );
        }

        // For sent notifications, we mark as cancelled rather than hard delete
        // to preserve delivery stats
        if (notification.status === 'sent') {
            await Notification.findByIdAndUpdate(id, {
                $set: { status: 'cancelled' },
            });

            return NextResponse.json({
                success: true,
                message: 'Sent notification cancelled successfully (stats preserved)',
            });
        }

        // For scheduled/draft notifications, hard delete
        await Notification.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        console.error('Admin delete notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── GET /api/admin/notifications/[id] ─────────────────────────────────────────

/**
 * GET /api/admin/notifications/[id]
 * Get notification details
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
        }

        const notification = await Notification.findById(id).lean() as any;

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            notification: {
                id: notification._id?.toString() || notification._id,
                title: notification.title,
                body: notification.body,
                data: notification.data,
                type: notification.type,
                targetAudience: notification.targetAudience,
                targetGender: notification.targetGender,
                targetUserIds: notification.targetUserIds,
                isScheduled: notification.isScheduled,
                scheduledFor: notification.scheduledFor,
                sentAt: notification.sentAt,
                status: notification.status,
                deliveryStats: notification.deliveryStats,
                createdBy: notification.createdBy,
                createdAt: notification.createdAt,
                updatedAt: notification.updatedAt,
            },
        });
    } catch (error) {
        console.error('Admin get notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
