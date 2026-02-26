import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Guardian } from '@/lib/db/models/Guardian';
import { User } from '@/lib/db/models/User';

// ─── GET /api/guardians/check-code ───────────────────────────────────────────

/**
 * GET /api/guardians/check-code?code=XXXXXX
 * Check if access code is valid (for preview before accepting)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: 'Access code is required' },
                { status: 400 }
            );
        }

        // Find guardian relationship with this access code
        const guardian = await Guardian.findOne({
            accessCode: code.toUpperCase(),
            status: 'pending',
        });

        if (!guardian) {
            return NextResponse.json({
                valid: false,
                message: 'Invalid or expired access code',
            });
        }

        // Get female user details
        const femaleUser = await User.findById(guardian.femaleUserId).select('name photos gender');

        return NextResponse.json({
            valid: true,
            guardian: {
                _id: guardian._id,
                guardianName: guardian.guardianName,
                guardianPhone: guardian.guardianPhone,
            },
            femaleUser: femaleUser ? {
                id: femaleUser._id,
                name: femaleUser.name,
                photos: femaleUser.photos || [],
                gender: femaleUser.gender,
            } : null,
        });
    } catch (error) {
        console.error('Check access code error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
