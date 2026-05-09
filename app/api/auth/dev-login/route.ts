import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await connectDB();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

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
        phoneNumber: user.phoneNumber,
        name: user.name,
        provider: user.provider,
        role: user.role,
        isNewUser: false,
        isOnboarded: user.isOnboarded,
        isPhoneVerified: user.isPhoneVerified ?? false,
        isEmailVerified: user.isEmailVerified ?? false,
        kycStatus: user.kycStatus ?? 'none',
        kycRejectedAt: user.kycRejectedAt ?? null,
      },
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
