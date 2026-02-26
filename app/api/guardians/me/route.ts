import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/guardians/me
 * Returns the current user's active guardian relationship.
 * Works for both female users (as the protected party) and male users (as the guardian).
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId } = authResult.user;

        // Fetch the user to determine gender
        const user = await User.findById(userId).select('gender');
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let guardian = null;

        if (user.gender === 'female') {
            // Female: look up by femaleUserId
            guardian = await Guardian.findOne({
                femaleUserId: userId,
                status: { $in: ['pending', 'active'] },
            }).sort({ createdAt: -1 });
        } else {
            // Male: look up by maleUserId
            guardian = await Guardian.findOne({
                maleUserId: userId,
                status: 'active',
            }).sort({ createdAt: -1 });
        }

        if (!guardian) {
            return NextResponse.json({ guardian: null }, { status: 200 });
        }

        // Enrich with counterpart user details
        let femaleUser = null;
        let maleUser   = null;

        if (guardian.femaleUserId) {
            const fu = await User.findById(guardian.femaleUserId).select('name photos');
            if (fu) femaleUser = { id: fu._id, name: fu.name, photos: fu.photos || [] };
        }

        if (guardian.maleUserId) {
            const mu = await User.findById(guardian.maleUserId).select('name photos');
            if (mu) maleUser = { id: mu._id, name: mu.name, photos: mu.photos || [] };
        }

        return NextResponse.json({
            guardian: {
                _id:           guardian._id,
                status:        guardian.status,
                guardianName:  guardian.guardianName,
                guardianPhone: guardian.guardianPhone,
                accessCode:    guardian.accessCode,
                requestedAt:   guardian.requestedAt?.toISOString(),
                linkedAt:      guardian.linkedAt?.toISOString() ?? null,
                revokedAt:     guardian.revokedAt?.toISOString() ?? null,
                createdAt:     (guardian as any).createdAt?.toISOString(),
                updatedAt:     (guardian as any).updatedAt?.toISOString(),
            },
            femaleUser,
            maleUser,
        });
    } catch (error) {
        console.error('GET /api/guardians/me error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
