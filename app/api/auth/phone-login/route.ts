import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { phoneNumber } = body;

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Validate phone number format (basic check)
        if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in database (expires in 10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        // Delete any existing OTP for this phone number
        await OTP.deleteMany({ phoneNumber });
        
        // Create new OTP
        await OTP.create({
            phoneNumber,
            code: otpCode,
            expiresAt,
        });

        // TODO: Send SMS via Twilio or other SMS service
        // For development, we'll return the OTP in the response
        console.log(`OTP for ${phoneNumber}: ${otpCode}`);
        
        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            // Remove in production - only for development
            ...(process.env.NODE_ENV === 'development' && { dev_otp: otpCode }),
        });
    } catch (error) {
        console.error('Phone login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
