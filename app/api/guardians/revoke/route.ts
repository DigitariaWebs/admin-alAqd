import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

// ─── POST /api/guardians/revoke ─────────────────────────────────────────────

/**
 * POST /api/guardians/revoke
 * Revoke guardian access (female user revokes male guardian)
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
                { error: 'Only female users can revoke guardian access' },
                { status: 403 }
            );
        }

        // Find active guardian relationship
        const guardian = await Guardian.findOne({
            femaleUserId: userId,
            status: 'active',
        });

        if (!guardian) {
            return NextResponse.json(
                { error: 'No active guardian relationship found' },
                { status: 404 }
            );
        }

        // Revoke the guardian relationship
        guardian.status = 'revoked';
        guardian.revokedAt = new Date();

        await guardian.save();

        return NextResponse.json({
            success: true,
            message: 'Guardian access revoked successfully',
            guardian: {
                _id: guardian._id,
                status: guardian.status,
                revokedAt: guardian.revokedAt?.toISOString(),
            },
        });
    } catch (error) {
        console.error('Revoke guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
