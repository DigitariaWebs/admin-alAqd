import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.STREAM_VIDEO_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_VIDEO_API_SECRET || '';

/**
 * POST /api/calls/token
 * Generates a Stream Video token for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      return NextResponse.json({ error: 'Stream Video credentials not configured' }, { status: 500 });
    }

    const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
    const token = client.generateUserToken({ user_id: authResult.user.userId });

    return NextResponse.json({
      success: true,
      token,
      apiKey: STREAM_API_KEY,
      userId: authResult.user.userId,
    });
  } catch (error) {
    console.error('Stream token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
