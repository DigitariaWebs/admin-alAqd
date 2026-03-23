import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/guardians/me
 * Returns the current user's active guardian relationship(s).
 * - Female users: single guardian relationship (as the protected party)
 * - Male users: all active guardian relationships (can guard multiple females)
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

        if (user.gender === 'female') {
            // Female: single guardian relationship
            const guardian = await Guardian.findOne({
                femaleUserId: userId,
                status: { $in: ['pending', 'active'] },
            }).sort({ createdAt: -1 });

            if (!guardian) {
                return NextResponse.json({ guardian: null }, { status: 200 });
            }

            let femaleUser = null;
            let maleUser = null;

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
        }

        // Male: return all active guardian relationships
        const guardians = await Guardian.find({
            maleUserId: userId,
            status: 'active',
        }).sort({ createdAt: -1 });

        if (guardians.length === 0) {
            return NextResponse.json({ guardian: null, guardianLinks: [] }, { status: 200 });
        }

        // Fetch all female users in one query
        const femaleIds = guardians
            .map((g) => g.femaleUserId)
            .filter(Boolean);
        const femaleUsers = await User.find({ _id: { $in: femaleIds } })
            .select('name photos')
            .lean();
        const femaleMap = new Map(
            femaleUsers.map((u) => [u._id.toString(), u])
        );

        const guardianLinks = guardians.map((g) => {
            const fu = g.femaleUserId ? femaleMap.get(g.femaleUserId.toString()) : null;
            return {
                guardian: {
                    _id:           g._id,
                    status:        g.status,
                    guardianName:  g.guardianName,
                    guardianPhone: g.guardianPhone,
                    linkedAt:      g.linkedAt?.toISOString() ?? null,
                    createdAt:     (g as any).createdAt?.toISOString(),
                },
                femaleUser: fu
                    ? { id: fu._id, name: fu.name, photos: fu.photos || [] }
                    : null,
            };
        });

        // Keep backward compat: guardian = first link
        const first = guardianLinks[0];
        return NextResponse.json({
            guardian: first.guardian,
            femaleUser: first.femaleUser,
            maleUser: null,
            guardianLinks,
        });
    } catch (error) {
        console.error('GET /api/guardians/me error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
