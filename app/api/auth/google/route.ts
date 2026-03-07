import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

async function verifyGoogleToken(
  accessToken: string,
): Promise<GoogleUserInfo | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${encodeURIComponent(accessToken)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.email || !data.id) return null;
    return data as GoogleUserInfo;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const body = await request.json();
        const { accessToken: googleAccessToken } = body;

        if (!googleAccessToken) {
          return NextResponse.json(
            { error: "Google access token is required" },
            { status: 400 },
          );
        }

        // Verify access token with Google and get user info
        const googleUser = await verifyGoogleToken(googleAccessToken);

        if (!googleUser) {
          return NextResponse.json(
            { error: "Invalid or expired Google token" },
            { status: 401 },
          );
        }

        if (!googleUser.verified_email) {
          return NextResponse.json(
            { error: "Google email is not verified" },
            { status: 401 },
          );
        }

        const { email, name, id: googleId } = googleUser;

        // Find or create user
        let user = await User.findOne({
          $or: [{ email: email.toLowerCase() }, { providerId: googleId }],
        });
        let isNewUser = false;

        if (!user) {
          user = await User.create({
            email: email.toLowerCase(),
            name,
            provider: "google",
            providerId: googleId,
            isEmailVerified: true,
            role: "user",
            status: "active",
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
