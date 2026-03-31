import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID || '';
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET || '';

/**
 * POST /api/calls/token
 * Generates a Twilio Video access token for the authenticated user.
 * Body: { roomName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { roomName } = await request.json();
    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      { identity: authResult.user.userId }
    );

    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    return NextResponse.json({
      success: true,
      token: token.toJwt(),
      roomName,
    });
  } catch (error) {
    console.error('Twilio token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
