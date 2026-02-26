import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

// ─── POST /api/guardians/resend ─────────────────────────────────────────────

/**
 * POST /api/guardians/resend
 * Resend guardian invitation (female user resends invitation to guardian)
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId } = authResult.user;

        // Check user gender
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.gender !== 'female') {
            return NextResponse.json(
                { error: 'Only female users can resend invitations' },
                { status: 403 }
            );
        }

        // Find pending guardian relationship
        const guardian = await Guardian.findOne({
            femaleUserId: userId,
            status: 'pending',
        }).sort({ createdAt: -1 });

        if (!guardian) {
            return NextResponse.json(
                { error: 'No pending guardian invitation found' },
                { status: 404 }
            );
        }

        // Generate new access code
        const newCode = guardian.generateAccessCode();
        await guardian.save();

        // TODO: Send email to guardian with access code
        // For now, we just return the code (in production, send via email)
        
        return NextResponse.json({
            success: true,
            message: 'Invitation resent successfully',
            accessCode: newCode,
            guardian: {
                _id: guardian._id,
                guardianName: guardian.guardianName,
                guardianPhone: guardian.guardianPhone,
                status: guardian.status,
                requestedAt: guardian.requestedAt?.toISOString(),
            },
        });
    } catch (error) {
        console.error('Resend invitation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
