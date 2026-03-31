import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Verification } from '@/lib/db/models/Verification';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';

// ─── PUT /api/admin/kyc/:id ─────────────────────────────────────────────────
// Admin approves or rejects a verification

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, rejectionReason } = body; // action: 'verify' | 'reject'

        if (!['verify', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Use "verify" or "reject"' }, { status: 400 });
        }

        const verification = await Verification.findById(id);
        if (!verification) {
            return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
        }

        const newStatus = action === 'verify' ? 'verified' : 'rejected';

        verification.status = newStatus;
        verification.rejectionReason = action === 'reject' ? (rejectionReason || 'Rejected by admin') : '';
        verification.reviewedBy = authResult.user.userId;
        verification.reviewedAt = new Date();
        await verification.save();

        // Update user kycStatus
        await User.findByIdAndUpdate(verification.userId, {
            kycStatus: newStatus,
        });

        return NextResponse.json({
            success: true,
            message: `Verification ${newStatus}`,
            verification,
        });
    } catch (error) {
        console.error('Admin KYC update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
