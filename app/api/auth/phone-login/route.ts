import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { OTP } from '@/lib/db/models/OTP';

function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

/**
 * Build a regex that matches a phone number by its digits alone,
 * ignoring any formatting characters (spaces, dashes, parens, dots).
 */
function buildPhoneDigitsRegex(normalizedPhone: string): RegExp {
  const digits = normalizedPhone.replace(/\D/g, "");
  const pattern = digits.split("").join("\\D*");
  return new RegExp(`^\\+?\\D*${pattern}\\D*$`);
}

export async function POST(request: NextRequest) {
    try {
      await connectDB();

      const body = await request.json();
      const { phoneNumber } = body;

      if (!phoneNumber) {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 },
        );
      }

      const normalizedPhoneNumber = normalizePhoneNumber(String(phoneNumber));

      // Validate phone number format (basic check)
      if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhoneNumber)) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 },
        );
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in database (expires in 10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete any existing OTP for this phone number (exact + regex fallback)
      const phoneDigitsRegex = buildPhoneDigitsRegex(normalizedPhoneNumber);
      await OTP.deleteMany({
        $or: [
          { phoneNumber: normalizedPhoneNumber },
          { phoneNumber: phoneDigitsRegex },
        ],
      });

      // Create new OTP
      await OTP.create({
        phoneNumber: normalizedPhoneNumber,
        code: otpCode,
        expiresAt,
      });

      // TODO: Send SMS via Twilio or other SMS service
      // For development, we'll return the OTP in the response
      console.log(`OTP for ${normalizedPhoneNumber}: ${otpCode}`);

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // Remove in production - only for development
        ...(process.env.NODE_ENV === "development" && { dev_otp: otpCode }),
      });
    } catch (error) {
        console.error('Phone login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
