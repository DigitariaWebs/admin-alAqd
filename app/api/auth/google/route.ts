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
  token: string,
): Promise<GoogleUserInfo | null> {
  try {
    // Try as idToken first (native Google Sign-In)
    const idTokenRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
    );
    if (idTokenRes.ok) {
      const data = await idTokenRes.json();
      if (data.email && data.sub) {
        return {
          id: data.sub,
          email: data.email,
          verified_email: data.email_verified === "true",
          name: data.name || data.email,
          given_name: data.given_name,
          family_name: data.family_name,
          picture: data.picture,
        };
      }
    }

    // Fallback: try as access token (web OAuth flow)
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${encodeURIComponent(token)}`,
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
          // Block suspended users
          if (user.status === 'suspended') {
            return NextResponse.json(
              { error: 'Votre compte a été suspendu' },
              { status: 403 }
            );
          }

          // Merge Google identity into existing account (e.g. phone user logging in with Google)
          if (!user.providerId && user.email === email.toLowerCase()) {
            user.providerId = googleId;
            user.isEmailVerified = true;
          }

          // Auto-repair isOnboarded flag for returning users
          if (!user.isOnboarded) {
            const signals = [
              Boolean(user.name && user.name !== "User" && user.name.trim() !== ""),
              Boolean(user.dateOfBirth),
              Boolean(user.gender),
              Boolean(user.profession && String(user.profession).trim() !== ""),
              Boolean(user.location && String(user.location).trim() !== ""),
              Boolean(user.bio && String(user.bio).trim() !== ""),
              Array.isArray(user.photos) && user.photos.length > 0,
              Array.isArray(user.interests) && user.interests.length > 0,
              Array.isArray(user.personality) && user.personality.length > 0,
              Array.isArray(user.nationality) && user.nationality.length > 0,
              Array.isArray(user.ethnicity) && user.ethnicity.length > 0,
              Boolean(user.education && String(user.education).trim() !== ""),
              Boolean(user.maritalStatus && String(user.maritalStatus).trim() !== ""),
              Boolean(user.religiousPractice && String(user.religiousPractice).trim() !== ""),
              Array.isArray(user.faithTags) && user.faithTags.length > 0,
              Boolean(user.height),
            ];
            if (signals.filter(Boolean).length >= 3) {
              user.isOnboarded = true;
            }
          }

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
                phoneNumber: user.phoneNumber,
                name: user.name,
                provider: user.provider,
                role: user.role,
                isNewUser,
                isOnboarded: user.isOnboarded,
                isPhoneVerified: user.isPhoneVerified ?? false,
                isEmailVerified: user.isEmailVerified ?? false,
                kycStatus: user.kycStatus ?? 'none',
                kycRejectedAt: user.kycRejectedAt ?? null,
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
