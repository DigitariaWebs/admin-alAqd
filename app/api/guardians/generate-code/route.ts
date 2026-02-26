import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

// ─── POST /api/guardians/generate-code ───────────────────────────────────────

/**
 * POST /api/guardians/generate-code
 * Generate a new access code for existing guardian relationship
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
                { error: 'Only female users can generate access codes' },
                { status: 403 }
            );
        }

        // Find active or pending guardian relationship
        const guardian = await Guardian.findOne({
            femaleUserId: userId,
            status: { $in: ['pending', 'active'] },
        });

        if (!guardian) {
            return NextResponse.json(
                { error: 'No guardian relationship found. Create one first.' },
                { status: 404 }
            );
        }

        // Generate new access code
        const newCode = guardian.generateAccessCode();
        await guardian.save();

        return NextResponse.json({
            success: true,
            message: 'Access code regenerated successfully',
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
        console.error('Generate access code error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
