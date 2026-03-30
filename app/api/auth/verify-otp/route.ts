import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';
import { User } from '@/lib/db/models/User';
import { generateAccessToken, generateRefreshToken, storeRefreshToken } from '@/lib/auth/jwt';
import { normalizePhoneNumber, buildPhoneDigitsRegex } from '@/lib/auth/phone-utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { phoneNumber, otp } = body;

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
        { status: 400 },
      );
    }

    const rawPhoneNumber = String(phoneNumber).trim();
    const normalizedPhoneNumber = normalizePhoneNumber(rawPhoneNumber);

    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    const lookupCandidates = [
      normalizedPhoneNumber,
      rawPhoneNumber,
      normalizedPhoneNumber.slice(1),
    ];

    // Regex that matches the same digits regardless of formatting
    const phoneDigitsRegex = buildPhoneDigitsRegex(normalizedPhoneNumber);

    console.log("[verify-otp] raw:", rawPhoneNumber, "normalized:", normalizedPhoneNumber, "regex:", phoneDigitsRegex);

    // Find OTP — try exact candidates first, then regex fallback
    let otpRecord = await OTP.findOne({
      phoneNumber: { $in: lookupCandidates },
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      otpRecord = await OTP.findOne({
        phoneNumber: phoneDigitsRegex,
        verified: false,
      }).sort({ createdAt: -1 });
      if (otpRecord) {
        console.log("[verify-otp] OTP found via regex fallback, stored phone:", otpRecord.phoneNumber);
      }
    }

    if (!otpRecord) {
      return NextResponse.json(
        { error: "OTP not found or already used" },
        { status: 401 },
      );
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new OTP." },
        { status: 429 },
      );
    }

    // Verify OTP
    if (otpRecord.code !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Find or create user — exact match first, then regex fallback
    let user = await User.findOne({ phoneNumber: { $in: lookupCandidates } });

    if (!user) {
      // Regex fallback: match the same digits regardless of stored formatting
      user = await User.findOne({ phoneNumber: phoneDigitsRegex });
      if (user) {
        console.log("[verify-otp] User found via regex fallback, stored phone:", user.phoneNumber, "→ normalizing to:", normalizedPhoneNumber);
        // Auto-normalize the stored phone so future lookups use exact match
        user.phoneNumber = normalizedPhoneNumber;
      }
    }

    let isNewUser = false;

    if (!user) {
      console.log("[verify-otp] No existing user found for", normalizedPhoneNumber, "— creating new user");
      // Create new user
      user = await User.create({
        phoneNumber: normalizedPhoneNumber,
        name: "User", // Temporary name, will be updated during onboarding
        isPhoneVerified: true,
        provider: "phone",
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

      console.log("[verify-otp] Found existing user:", user._id, "name:", user.name, "phone:", user.phoneNumber, "isOnboarded:", user.isOnboarded);
      // Update existing user
      user.isPhoneVerified = true;
      user.lastActive = new Date();

      // Auto-repair isOnboarded flag for returning users whose flag
      // was never persisted (e.g. network failure on guidelines screen,
      // manual DB seed, or app crash during onboarding).
      // A user is considered onboarded if they have completed at least
      // the first three onboarding steps (name → dob → gender) OR have
      // photos — any of these signals means they clearly went through
      // the flow.
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
          Boolean(
            user.maritalStatus && String(user.maritalStatus).trim() !== "",
          ),
          Boolean(
            user.religiousPractice &&
            String(user.religiousPractice).trim() !== "",
          ),
          Array.isArray(user.faithTags) && user.faithTags.length > 0,
          Boolean(user.height),
        ];

        const completedSignals = signals.filter(Boolean).length;

        if (completedSignals >= 3) {
          user.isOnboarded = true;
        }
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
        email: user.email,
        name: user.name,
        provider: user.provider,
        role: user.role,
        isNewUser,
        isOnboarded: user.isOnboarded,
        isPhoneVerified: user.isPhoneVerified ?? false,
        isEmailVerified: user.isEmailVerified ?? false,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
