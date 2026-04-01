import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.STREAM_VIDEO_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_VIDEO_API_SECRET || '';

/**
 * POST /api/calls/token
 * Generates a Stream Video token for the authenticated user.
 * Also upserts the user and the call participant in Stream.
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

    await connectDB();

    const { participantId } = await request.json().catch(() => ({}));

    const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

    // Upsert the caller in Stream
    const caller = await User.findById(authResult.user.userId).select('name photos').lean();
    await client.upsertUsers([{
      id: authResult.user.userId,
      name: caller?.name || 'User',
      image: caller?.photos?.[0] || '',
    }]);

    // Upsert the participant if provided
    if (participantId) {
      const participant = await User.findById(participantId).select('name photos').lean();
      if (participant) {
        await client.upsertUsers([{
          id: participantId,
          name: participant.name || 'User',
          image: participant.photos?.[0] || '',
        }]);
      }
    }

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
