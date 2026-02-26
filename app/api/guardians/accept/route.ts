import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

// ─── POSTlib/auth/middleware /api/guardians/accept ───────────────────────────────────────────────

/**
 * POST /api/guardians/accept
 * Accept guardian invitation (male user uses access code)
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { userId } = authResult.user;

        // Check user gender - only males can accept
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.gender !== 'male') {
            return NextResponse.json(
                { error: 'Only male users can accept guardian invitations' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { accessCode } = body;

        if (!accessCode) {
            return NextResponse.json(
                { error: 'Access code is required' },
                { status: 400 }
            );
        }

        // Find guardian relationship with this access code
        const guardian = await Guardian.findOne({
            accessCode: accessCode.toUpperCase(),
            status: 'pending',
        });

        if (!guardian) {
            return NextResponse.json(
                { error: 'Invalid or expired access code' },
                { status: 404 }
            );
        }

        if (!guardian.femaleUserId) {
            return NextResponse.json(
                { error: 'Invalid guardian record' },
                { status: 400 }
            );
        }

        // Check if user is already linked to another female
        const existingLink = await Guardian.findOne({
            maleUserId: userId,
            status: 'active',
        });

        if (existingLink) {
            return NextResponse.json(
                { error: 'You are already linked as a guardian to another user' },
                { status: 400 }
            );
        }

        // Link the male user to the guardian relationship
        if (guardian.maleUserId) {
            guardian.maleUserId = userId as any;
        }
        guardian.status = 'active';
        guardian.linkedAt = new Date();

        await guardian.save();

        // Get female user details
        const femaleUser = guardian.femaleUserId 
            ? await User.findById(guardian.femaleUserId).select('name photos gender')
            : null;

        return NextResponse.json({
            success: true,
            message: 'Guardian relationship accepted successfully',
            guardian: {
                _id: guardian._id,
                guardianName: guardian.guardianName,
                guardianPhone: guardian.guardianPhone,
                status: guardian.status,
                linkedAt: guardian.linkedAt?.toISOString(),
            },
            femaleUser: femaleUser ? {
                id: femaleUser._id,
                name: femaleUser.name,
                photos: femaleUser.photos || [],
                gender: femaleUser.gender,
            } : null,
        });
    } catch (error) {
        console.error('Accept guardian error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
