import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { SystemLog } from '@/lib/db/models/SystemLog';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/support/logs/export ───────────────────────────────────────────

/**
 * GET /api/admin/support/logs/export
 * Export system logs
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Filters
        const level = searchParams.get('level');
        const category = searchParams.get('category');
        const user = searchParams.get('user');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const format = searchParams.get('format') || 'json';

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

        // Get all matching logs (limit to 10000 for export)
        const logs = await SystemLog.find(query)
            .sort({ createdAt: -1 })
            .limit(10000)
            .lean() as any[];

        const exportData = logs.map(log => ({
            timestamp: log.createdAt.toISOString(),
            level: log.level,
            category: log.category,
            message: log.message,
            user: log.user,
            ip: log.ip,
            context: log.context ? JSON.stringify(log.context) : '',
        }));

        if (format === 'csv') {
            // Generate CSV
            const headers = ['timestamp', 'level', 'category', 'message', 'user', 'ip', 'context'];
            const csvRows = [headers.join(',')];
            
            for (const row of exportData) {
                const values = [
                    row.timestamp,
                    row.level,
                    row.category,
                    `"${row.message.replace(/"/g, '""')}"`,
                    row.user || '',
                    row.ip || '',
                    row.context ? `"${row.context.replace(/"/g, '""')}"` : '',
                ];
                csvRows.push(values.join(','));
            }

            const csv = csvRows.join('\n');
            
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=system-logs-${new Date().toISOString().split('T')[0]}.csv`,
                },
            });
        }

        // Default to JSON
        return NextResponse.json({
            success: true,
            exportedAt: new Date().toISOString(),
            count: exportData.length,
            logs: exportData,
        });
    } catch (error) {
        console.error('Admin export logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
