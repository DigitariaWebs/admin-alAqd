import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireRole } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

// ─── PATCH /api/admin/users/[id]/role ─────────────────────────────────────────

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }

        const body = await request.json();
        const { role } = body;

        // Validate role
        const validRoles = ['user', 'moderator', 'admin'];
        if (!role || !validRoles.includes(role)) {
            return NextResponse.json({ 
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            }, { status: 400 });
        }

        // Prevent self-role-change
        if (authResult.user.userId === id) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
        }

        const user = await User.findById(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent lowering own role (only admins can assign admin)
        if (user.role === 'admin' && role !== 'admin') {
            return NextResponse.json({ error: 'Cannot downgrade admin role' }, { status: 403 });
        }

        user.role = role;
        user.updatedAt = new Date();
        await user.save();

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        console.error('Admin update user role error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
