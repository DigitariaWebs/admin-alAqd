import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// ─── PATCH /api/admin/users/[id]/status ───────────────────────────────────────

/**
 * PATCH /api/admin/users/[id]/status
 * Update user status (active/inactive/suspended)
 */
export async function PATCH(
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        const body = await request.json();
        const { status } = body;

        // Validate status
        const validStatuses = ['active', 'inactive', 'suspended', 'banned'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            }, { status: 400 });
        }

        // Prevent self-status-change
        if (authResult.user.userId === id) {
            return NextResponse.json({ error: 'Cannot change your own status' }, { status: 400 });
        }

        const user = await User.findById(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Moderators cannot modify admin or other moderator accounts
        if (authResult.user.role === 'moderator' && (user.role === 'admin' || user.role === 'moderator')) {
            return NextResponse.json({ error: 'Vous n\'avez pas la permission de modifier ce compte' }, { status: 403 });
        }

        user.status = status;
        user.updatedAt = new Date();
        await user.save();

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                status: user.status,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Admin update user status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
