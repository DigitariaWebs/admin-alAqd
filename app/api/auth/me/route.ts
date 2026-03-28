import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireAuth(request);
        
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // Fetch user from database
        const user = await User.findById(authResult.user.userId).select('-password');
        
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.status === 'suspended') {
            return NextResponse.json(
                { error: 'Votre compte a été suspendu' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                phoneNumber: user.phoneNumber,
                status: user.status,
                lastActive: user.lastActive,
                isOnboarded: user.isOnboarded,
                isPhoneVerified: user.isPhoneVerified,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
