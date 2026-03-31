import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Verification } from '@/lib/db/models/Verification';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/kyc ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status'); // pending, verified, rejected, manual_review

        const filter: Record<string, unknown> = {};
        if (status) filter.status = status;

        const [verifications, total] = await Promise.all([
            Verification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('userId', 'name email gender photos kycStatus')
                .populate('reviewedBy', 'name')
                .lean(),
            Verification.countDocuments(filter),
        ]);

        // Count by status
        const [pendingCount, manualCount, verifiedCount, rejectedCount] = await Promise.all([
            Verification.countDocuments({ status: 'pending' }),
            Verification.countDocuments({ status: 'manual_review' }),
            Verification.countDocuments({ status: 'verified' }),
            Verification.countDocuments({ status: 'rejected' }),
        ]);

        return NextResponse.json({
            success: true,
            verifications,
            stats: {
                pending: pendingCount,
                manual_review: manualCount,
                verified: verifiedCount,
                rejected: rejectedCount,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin KYC list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
