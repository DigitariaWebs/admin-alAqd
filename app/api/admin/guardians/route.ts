import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── Helper Functions ───────────────────────────────────────────────────────

function serializeGuardian(guardian: any) {
    return {
        _id: guardian._id,
        femaleUserId: guardian.femaleUserId,
        maleUserId: guardian.maleUserId,
        guardianName: guardian.guardianName,
        guardianPhone: guardian.guardianPhone,
        accessCode: guardian.accessCode,
        status: guardian.status,
        requestedAt: guardian.requestedAt?.toISOString(),
        linkedAt: guardian.linkedAt?.toISOString(),
        revokedAt: guardian.revokedAt?.toISOString(),
        createdAt: guardian.createdAt?.toISOString(),
        updatedAt: guardian.updatedAt?.toISOString(),
    };
}

// ─── GET /api/admin/guardians ────────────────────────────────────────────────

/**
 * GET /api/admin/guardians
 * List all guardian relationships (Admin)
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
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: Record<string, unknown> = {};

        if (status) {
            query.status = status;
        }

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        // Search
        if (search) {
            query.$or = [
                { guardianName: { $regex: search, $options: 'i' } },
                { guardianPhone: { $regex: search, $options: 'i' } },
                { accessCode: { $regex: search, $options: 'i' } },
            ];
        }

        // Sort
        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [guardians, total] = await Promise.all([
            Guardian.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Guardian.countDocuments(query),
        ]);

        // Get user details for each guardian
        const guardianIds = guardians.map((g: any) => g.femaleUserId);
        const maleUserIds = guardians
            .filter((g: any) => g.maleUserId)
            .map((g: any) => g.maleUserId);

        const [femaleUsers, maleUsers] = await Promise.all([
            User.find({ _id: { $in: guardianIds } }).select('name photos gender').lean(),
            maleUserIds.length > 0
                ? User.find({ _id: { $in: maleUserIds } }).select('name photos gender').lean()
                : Promise.resolve([]),
        ]);

        const femaleUserMap = new Map(femaleUsers.map((u: any) => [u._id.toString(), u]));
        const maleUserMap = new Map(maleUsers.map((u: any) => [u._id.toString(), u]));

        // Enrich guardian data with user details
        const enrichedGuardians = guardians.map((guardian: any) => {
            const femaleUser = femaleUserMap.get(guardian.femaleUserId.toString());
            const maleUser = guardian.maleUserId
                ? maleUserMap.get(guardian.maleUserId.toString())
                : null;

            return {
                ...serializeGuardian(guardian),
                femaleUser: femaleUser
                    ? {
                          id: femaleUser._id,
                          name: femaleUser.name,
                          photos: femaleUser.photos || [],
                          gender: femaleUser.gender,
                      }
                    : null,
                maleUser: maleUser
                    ? {
                          id: maleUser._id,
                          name: maleUser.name,
                          photos: maleUser.photos || [],
                          gender: maleUser.gender,
                      }
                    : null,
            };
        });

        // Calculate stats
        const stats = await Guardian.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const statsMap: Record<string, number> = {
            total: total,
            pending: 0,
            active: 0,
            revoked: 0,
        };

        stats.forEach((s: any) => {
            statsMap[s._id] = s.count;
        });

        return NextResponse.json({
            success: true,
            guardians: enrichedGuardians,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
            stats: statsMap,
        });
    } catch (error) {
        console.error('List guardians error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
