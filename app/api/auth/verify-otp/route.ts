import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { phoneNumber, otp } = body;

        if (!phoneNumber || !otp) {
            return NextResponse.json(
                { error: 'Phone number and OTP are required' },
                { status: 400 }
            );
        }

        // Find OTP
        const otpRecord = await OTP.findOne({
            phoneNumber,
            verified: false,
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return NextResponse.json(
                { error: 'OTP not found or already used' },
                { status: 401 }
            );
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'OTP has expired' },
                { status: 401 }
            );
        }

        // Check attempts
        if (otpRecord.attempts >= 5) {
            return NextResponse.json(
                { error: 'Too many attempts. Please request a new OTP.' },
                { status: 429 }
            );
        }

        // Verify OTP
        if (otpRecord.code !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            
            return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 401 }
            );
        }

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Find or create user
        let user = await User.findOne({ phoneNumber });
        let isNewUser = false;

        if (!user) {
            // Create new user
            user = await User.create({
                phoneNumber,
                name: 'User', // Temporary name, will be updated during onboarding
                isPhoneVerified: true,
                provider: 'phone',
                role: 'user',
                status: 'active',
                isOnboarded: false,
            });
            isNewUser = true;
        } else {
            // Update existing user
            user.isPhoneVerified = true;
            user.lastActive = new Date();
            // If the user has a real name (not the placeholder) and isn't
            // already marked as onboarded, fix the flag so they aren't
            // sent back through the onboarding flow on every login.
            if (!user.isOnboarded && user.name && user.name !== 'User') {
                user.isOnboarded = true;
            }
            await user.save();
        }

        // Generate tokens
        const tokenPayload = {
            userId: user._id.toString(),
            phoneNumber: user.phoneNumber!,
            role: user.role,
        };
        
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        
        // Store refresh token
        await storeRefreshToken(user._id.toString(), refreshToken);

        return NextResponse.json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                phoneNumber: user.phoneNumber,
                name: user.name,
                role: user.role,
                isNewUser,
                isOnboarded: user.isOnboarded,
            },
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
