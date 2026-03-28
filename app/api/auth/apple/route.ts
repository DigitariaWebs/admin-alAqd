import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { identityToken, email, name } = body;

        if (!identityToken) {
            return NextResponse.json(
                { error: 'Apple identity token is required' },
                { status: 400 }
            );
        }

        // TODO: Verify Apple identity token with Apple API
        // For now, accepting the provided email and name
        
        const userEmail = email || `apple_${Date.now()}@privaterelay.appleid.com`;
        const userName = name || 'Apple User';

        // Find or create user
        let user = await User.findOne({ providerId: identityToken });
        let isNewUser = false;

        if (!user && email) {
            user = await User.findOne({ email: email.toLowerCase() });
        }

        if (!user) {
            user = await User.create({
                email: userEmail.toLowerCase(),
                name: userName,
                provider: 'apple',
                providerId: identityToken,
                isEmailVerified: true,
                role: 'user',
                status: 'active',
                isOnboarded: false,
            });
            isNewUser = true;
        } else {
            // Block suspended users
            if (user.status === 'suspended') {
                return NextResponse.json(
                    { error: 'Votre compte a été suspendu' },
                    { status: 403 }
                );
            }

            user.lastActive = new Date();
            await user.save();
        }

        // Generate tokens
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
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
        console.error('Apple login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
