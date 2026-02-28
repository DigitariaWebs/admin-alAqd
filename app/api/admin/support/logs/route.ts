import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { SystemLog, ISystemLog } from '@/lib/db/models/SystemLog';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/support/logs ───────────────────────────────────────────────────

/**
 * GET /api/admin/support/logs
 * List system logs with filters
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Filters
        const level = searchParams.get('level');
        const category = searchParams.get('category');
        const user = searchParams.get('user');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');

        // Build query
        const query: Record<string, unknown> = {};
        if (level) query.level = level;
        if (category) query.category = category;
        if (user) query.user = user;
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        if (search) {
            query.message = { $regex: search, $options: 'i' };
        }

        // Sort
        const sort: Record<string, 1 | -1> = { createdAt: -1 };

        // Execute query
        const [logs, total] = await Promise.all([
            SystemLog.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean() as Promise<any[]>,
            SystemLog.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            logs: logs.map(log => ({
                id: log._id.toString(),
                level: log.level,
                message: log.message,
                category: log.category,
                context: log.context,
                user: log.user,
                ip: log.ip,
                createdAt: log.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin list logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
