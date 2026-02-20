import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { RefreshToken } from '@/lib/db/models/RefreshToken';
import { User } from '@/lib/db/models/User';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken, storeRefreshToken, revokeRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token is required' },
                { status: 400 }
            );
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        if (!decoded) {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            );
        }

        // Check if token exists and is not revoked
        const tokenRecord = await RefreshToken.findOne({
            token: refreshToken,
            userId: decoded.userId,
        });

        if (!tokenRecord || tokenRecord.isRevoked) {
            return NextResponse.json(
                { error: 'Refresh token has been revoked' },
                { status: 401 }
            );
        }

        // Check if token is expired
        if (tokenRecord.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Refresh token has expired' },
                { status: 401 }
            );
        }

        // Get user
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Generate new tokens
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
        };
        
        const newAccessToken = generateAccessToken(tokenPayload);
        const newRefreshToken = generateRefreshToken(tokenPayload);
        
        // Revoke old refresh token
        await revokeRefreshToken(refreshToken);
        
        // Store new refresh token
        await storeRefreshToken(user._id.toString(), newRefreshToken);

        return NextResponse.json({
            success: true,
            token: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
