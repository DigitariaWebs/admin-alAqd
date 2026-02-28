import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Notification } from '@/lib/db/models/Notification';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// ─── GET /api/admin/notifications ───────────────────────────────────────────────

/**
 * GET /api/admin/notifications
 * List notification history with filters (status, type, date range)
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
        const type = searchParams.get('type');
        const isScheduled = searchParams.get('isScheduled');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: Record<string, unknown> = {};

        if (status) query.status = status;
        if (type) query.type = type;
        if (isScheduled !== null && isScheduled !== undefined) {
            query.isScheduled = isScheduled === 'true';
        }

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        // Sort
        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
        ]);

        // Get scheduled notifications count
        const scheduledCount = await Notification.countDocuments({ 
            isScheduled: true, 
            status: { $in: ['scheduled', 'draft'] } 
        });

        return NextResponse.json({
            success: true,
            notifications: notifications.map((notification: Record<string, any>) => ({
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
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            additionalCounts: {
                scheduled: scheduledCount,
            },
        });
    } catch (error) {
        console.error('Admin list notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── POST /api/admin/notifications ───────────────────────────────────────────────

/**
 * POST /api/admin/notifications
 * Send push notification or schedule notification
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const {
            title,
            body: messageBody,
            data,
            type = 'broadcast',
            targetAudience = 'all',
            targetGender,
            targetUserIds,
            isScheduled = false,
            scheduledFor,
            sendNow = true,
        } = body;

        // Validation
        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        if (!messageBody) {
            return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
        }

        // Validate scheduled notification
        if (isScheduled && !scheduledFor) {
            return NextResponse.json({ error: 'Scheduled time is required for scheduled notifications' }, { status: 400 });
        }

        if (isScheduled && new Date(scheduledFor) <= new Date()) {
            return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
        }

        // Calculate target users for stats
        let totalRecipients = 0;
        let recipientFilter: Record<string, unknown> = { status: 'active' };

        if (targetAudience === 'premium') {
            recipientFilter['subscription.plan'] = { $in: ['premium', 'gold'] };
            totalRecipients = await User.countDocuments(recipientFilter);
        } else if (targetAudience === 'free') {
            recipientFilter.$or = [
                { 'subscription.plan': 'free' },
                { subscription: { $exists: false } },
                { 'subscription.isActive': false },
            ];
            totalRecipients = await User.countDocuments(recipientFilter);
        } else if (targetAudience === 'gender' && targetGender) {
            recipientFilter.gender = targetGender;
            totalRecipients = await User.countDocuments(recipientFilter);
        } else if (targetAudience === 'custom' && targetUserIds && targetUserIds.length > 0) {
            totalRecipients = targetUserIds.length;
        } else {
            // All users
            totalRecipients = await User.countDocuments(recipientFilter);
        }

        // Create notification record
        const notification = await Notification.create({
            title,
            body: messageBody,
            data,
            type,
            targetAudience,
            targetGender,
            targetUserIds: targetUserIds || [],
            isScheduled,
            scheduledFor: isScheduled ? new Date(scheduledFor) : undefined,
            status: isScheduled ? 'scheduled' : (sendNow ? 'sent' : 'draft'),
            sentAt: sendNow && !isScheduled ? new Date() : undefined,
            deliveryStats: {
                totalRecipients,
                sent: sendNow && !isScheduled ? totalRecipients : 0,
                delivered: 0,
                failed: 0,
            },
            createdBy: authResult.user.userId,
        });

        // TODO: Integrate with actual push notification service (Firebase, OneSignal, etc.)
        // For now, we'll simulate the push notification sending
        if (sendNow && !isScheduled) {
            // In production, you would:
            // 1. Query users based on targetAudience
            // 2. Send push notification via FCM/APNs/OneSignal
            // 3. Update deliveryStats based on results
            
            console.log(`[PUSH NOTIFICATION] Sending to ${totalRecipients} recipients:`);
            console.log(`Title: ${title}`);
            console.log(`Body: ${messageBody}`);
            
            // Simulate successful delivery (in production, this would be actual delivery count)
            notification.deliveryStats = {
                totalRecipients,
                sent: totalRecipients,
                delivered: Math.floor(totalRecipients * 0.95), // 95% delivery rate
                failed: Math.floor(totalRecipients * 0.05), // 5% failure rate
            };
            await notification.save();
        }

        return NextResponse.json({
            success: true,
            notification: {
                id: notification._id.toString(),
                title: notification.title,
                body: notification.body,
                type: notification.type,
                targetAudience: notification.targetAudience,
                targetGender: notification.targetGender,
                isScheduled: notification.isScheduled,
                scheduledFor: notification.scheduledFor,
                sentAt: notification.sentAt,
                status: notification.status,
                deliveryStats: notification.deliveryStats,
                createdAt: notification.createdAt,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Admin send notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
