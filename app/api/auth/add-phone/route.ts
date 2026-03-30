import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { normalizePhoneNumber, buildPhoneDigitsRegex } from '@/lib/auth/phone-utils';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizePhoneNumber(String(phoneNumber));

    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 },
      );
    }

    // Check if phone is already in use by another user
    const phoneDigitsRegex = buildPhoneDigitsRegex(normalizedPhone);
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber: normalizedPhone },
        { phoneNumber: phoneDigitsRegex },
      ],
      _id: { $ne: authResult.user.userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already in use by another account' },
        { status: 409 },
      );
    }

    // Find and verify OTP
    const lookupCandidates = [
      normalizedPhone,
      String(phoneNumber).trim(),
      normalizedPhone.slice(1),
    ];

    let otpRecord = await OTP.findOne({
      phoneNumber: { $in: lookupCandidates },
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      otpRecord = await OTP.findOne({
        phoneNumber: phoneDigitsRegex,
        verified: false,
      }).sort({ createdAt: -1 });
    }

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP not found or already used' },
        { status: 401 },
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 401 });
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 },
      );
    }

    if (otpRecord.code !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update user
    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.phoneNumber = normalizedPhone;
    user.isPhoneVerified = true;
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
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified ?? false,
      },
    });
  } catch (error) {
    console.error('Add phone error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
