import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/guardians/export ─────────────────────────────────────────

/**
 * GET /api/admin/guardians/export
 * Export guardian relationships to CSV (Admin)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Filters
        const status = searchParams.get('status');
        const format = searchParams.get('format') || 'csv';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query
        const query: Record<string, unknown> = {};

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        // Get all guardians matching query
        const guardians = await Guardian.find(query).sort({ createdAt: -1 }).lean();

        // Get user details
        const femaleUserIds = guardians.map((g: any) => g.femaleUserId);
        const maleUserIds = guardians
            .filter((g: any) => g.maleUserId)
            .map((g: any) => g.maleUserId);

        const [femaleUsers, maleUsers] = await Promise.all([
            User.find({ _id: { $in: femaleUserIds } }).select('name email phoneNumber').lean(),
            maleUserIds.length > 0
                ? User.find({ _id: { $in: maleUserIds } }).select('name email phoneNumber').lean()
                : Promise.resolve([]),
        ]);

        const femaleUserMap = new Map(femaleUsers.map((u: any) => [u._id.toString(), u]));
        const maleUserMap = new Map(maleUsers.map((u: any) => [u._id.toString(), u]));

        // Format data
        const data = guardians.map((guardian: any) => {
            const femaleUser = femaleUserMap.get(guardian.femaleUserId.toString());
            const maleUser = guardian.maleUserId
                ? maleUserMap.get(guardian.maleUserId.toString())
                : null;

            return {
                id: guardian._id,
                femaleUserName: femaleUser?.name || 'Unknown',
                femaleUserEmail: femaleUser?.email || 'Unknown',
                femaleUserPhone: femaleUser?.phoneNumber || 'Unknown',
                guardianName: guardian.guardianName,
                guardianPhone: guardian.guardianPhone,
                maleUserName: maleUser?.name || 'Not linked',
                maleUserEmail: maleUser?.email || 'Not linked',
                status: guardian.status,
                accessCode: guardian.accessCode,
                requestedAt: guardian.requestedAt?.toISOString() || '',
                linkedAt: guardian.linkedAt?.toISOString() || '',
                revokedAt: guardian.revokedAt?.toISOString() || '',
                createdAt: guardian.createdAt?.toISOString() || '',
            };
        });

        if (format === 'json') {
            return NextResponse.json({
                success: true,
                data,
                exportedAt: new Date().toISOString(),
            });
        }

        // CSV format
        const headers = [
            'ID',
            'Female User Name',
            'Female User Email',
            'Female User Phone',
            'Guardian Name',
            'Guardian Phone',
            'Male User Name',
            'Male User Email',
            'Status',
            'Access Code',
            'Requested At',
            'Linked At',
            'Revoked At',
            'Created At',
        ];

        const csvRows = [headers.join(',')];

        data.forEach((row: any) => {
            const values = [
                row.id,
                `"${row.femaleUserName}"`,
                row.femaleUserEmail || '',
                row.femaleUserPhone || '',
                `"${row.guardianName}"`,
                row.guardianPhone,
                row.maleUserName || '',
                row.maleUserEmail || '',
                row.status,
                row.accessCode,
                row.requestedAt,
                row.linkedAt,
                row.revokedAt,
                row.createdAt,
            ];
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="guardians-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Export guardians error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
