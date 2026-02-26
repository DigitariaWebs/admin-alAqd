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

// ─── GET /api/admin/guardians/[id] ───────────────────────────────────────────

/**
 * GET /api/admin/guardians/[id]
 * Get guardian relationship details (Admin)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const guardian = await Guardian.findById(id);

        if (!guardian) {
            return NextResponse.json({ error: 'Guardian relationship not found' }, { status: 404 });
        }

        // Get female user details
        const femaleUser = await User.findById(guardian.femaleUserId).select('-password').lean();
        
        // Get male user details if linked
        const maleUser = guardian.maleUserId
            ? await User.findById(guardian.maleUserId).select('-password').lean()
            : null;

        return NextResponse.json({
            success: true,
            guardian: serializeGuardian(guardian),
            femaleUser: femaleUser
                ? {
                      ...femaleUser,
                      _id: femaleUser._id,
                      createdAt: femaleUser.createdAt?.toISOString(),
                      updatedAt: femaleUser.updatedAt?.toISOString(),
                  }
                : null,
            maleUser: maleUser
                ? {
                      ...maleUser,
                      _id: maleUser._id,
                      createdAt: maleUser?.createdAt?.toISOString(),
                      updatedAt: maleUser?.updatedAt?.toISOString(),
                  }
                : null,
        });
    } catch (error) {
        console.error('Get guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ─── PATCH /api/admin/guardians/[id] ─────────────────────────────────────────

/**
 * PATCH /api/admin/guardians/[id]
 * Update guardian relationship status (Admin)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, guardianName, guardianPhone } = body;

        const guardian = await Guardian.findById(id);

        if (!guardian) {
            return NextResponse.json({ error: 'Guardian relationship not found' }, { status: 404 });
        }

        // Update fields
        if (status) {
            if (!['pending', 'active', 'revoked'].includes(status)) {
                return NextResponse.json(
                    { error: 'Invalid status. Must be pending, active, or revoked' },
                    { status: 400 }
                );
            }
            guardian.status = status;
            
            if (status === 'active' && !guardian.linkedAt) {
                guardian.linkedAt = new Date();
            }
            if (status === 'revoked' && !guardian.revokedAt) {
                guardian.revokedAt = new Date();
            }
        }

        if (guardianName) {
            guardian.guardianName = guardianName;
        }

        if (guardianPhone) {
            guardian.guardianPhone = guardianPhone;
        }

        await guardian.save();

        return NextResponse.json({
            success: true,
            message: 'Guardian relationship updated successfully',
            guardian: serializeGuardian(guardian),
        });
    } catch (error) {
        console.error('Update guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// ─── DELETE /api/admin/guardians/[id] ───────────────────────────────────────

/**
 * DELETE /api/admin/guardians/[id]
 * Delete guardian relationship (Admin)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const guardian = await Guardian.findById(id);

        if (!guardian) {
            return NextResponse.json({ error: 'Guardian relationship not found' }, { status: 404 });
        }

        await Guardian.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Guardian relationship deleted successfully',
        });
    } catch (error) {
        console.error('Delete guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
