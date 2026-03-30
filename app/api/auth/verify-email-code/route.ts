import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      type: 'email',
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Code not found or already used' },
        { status: 401 },
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 401 });
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 429 },
      );
    }

    if (otpRecord.code !== code) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update user
    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.email = normalizedEmail;
    user.isEmailVerified = true;
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        provider: user.provider,
        role: user.role,
        isOnboarded: user.isOnboarded,
        isPhoneVerified: user.isPhoneVerified ?? false,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
