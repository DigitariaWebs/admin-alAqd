import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { idToken, email, name } = body;

        if (!idToken) {
            return NextResponse.json(
                { error: 'Google ID token is required' },
                { status: 400 }
            );
        }

        // TODO: Verify Google ID token with Google API
        // For now, accepting the provided email and name
        
        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });
        let isNewUser = false;

        if (!user) {
            user = await User.create({
                email: email.toLowerCase(),
                name,
                provider: 'google',
                providerId: idToken,
                isEmailVerified: true,
                role: 'user',
                status: 'active',
                isOnboarded: false,
            });
            isNewUser = true;
        } else {
            user.lastActive = new Date();
            await user.save();
        }

        // Generate tokens
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email!,
            role: user.role,
        };
        
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        
        await storeRefreshToken(user._id.toString(), refreshToken);

        return NextResponse.json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                provider: user.provider,
                role: user.role,
                isNewUser,
                isOnboarded: user.isOnboarded,
            },
        });
    } catch (error) {
        console.error('Google login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
