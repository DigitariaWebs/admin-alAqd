import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const email = body?.email?.trim?.().toLowerCase?.() ?? "";
        const password = body?.password;
        
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if user is admin or moderator
        if (user.role !== 'admin' && user.role !== 'moderator') {
            return NextResponse.json(
                { error: 'Access denied. Admin privileges required.' },
                { status: 403 }
            );
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if account is active
        if (user.status !== 'active') {
            return NextResponse.json(
                { error: 'Account is suspended or inactive' },
                { status: 403 }
            );
        }

        // Generate tokens
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email!,
            role: user.role,
        };
        
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        
        // Store refresh token
        await storeRefreshToken(user._id.toString(), refreshToken);
        
        // Update last active
        user.lastActive = new Date();
        await user.save();

        return NextResponse.json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
