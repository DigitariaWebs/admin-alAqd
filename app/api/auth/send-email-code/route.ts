import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { sendNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is already in use by another user
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: authResult.user.userId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use by another account' },
        { status: 409 },
      );
    }

    // Delete any existing email OTP for this email
    await OTP.deleteMany({ email: normalizedEmail, type: 'email' });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({
      email: normalizedEmail,
      type: 'email',
      code,
      expiresAt,
    });

    // Send email
    try {
      await sendNotificationEmail({
        to: normalizedEmail,
        subject: 'Al-Aqd — Code de vérification',
        body: `Votre code de vérification est : ${code}\n\nCe code expire dans 10 minutes.`,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 },
      );
    }

    console.log(`Email verification code for ${normalizedEmail}: ${code}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      ...(process.env.ENABLE_DEV_OTP === 'true' && { dev_code: code }),
    });
  } catch (error) {
    console.error('Send email code error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
