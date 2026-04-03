import { NextRequest, NextResponse } from 'next/server';
import mongoose from "mongoose";
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Message } from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.STREAM_VIDEO_API_KEY || '';
const STREAM_API_SECRET = process.env.STREAM_VIDEO_API_SECRET || '';
const RECENT_CALL_INVITE_WINDOW_MS = 10 * 60 * 1000;

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

    const payload = await request.json().catch(() => ({}));
    const participantId =
      typeof payload?.participantId === "string"
        ? payload.participantId
        : undefined;
    const validateOnly = payload?.validateOnly === true;

    if (participantId && !mongoose.Types.ObjectId.isValid(participantId)) {
      return NextResponse.json(
        { error: "Invalid participantId" },
        { status: 400 },
      );
    }

    const caller = await User.findById(authResult.user.userId)
      .select("name photos gender")
      .lean();

    if (!caller) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let participant: {
      name?: string;
      photos?: string[];
      gender?: "male" | "female";
      callAuthorizedFor?: string[];
      status?: string;
    } | null = null;

    if (participantId) {
      participant = await User.findById(participantId)
        .select("name photos gender callAuthorizedFor status")
        .lean();

      if (!participant || participant.status === "banned") {
        return NextResponse.json(
          { error: "Participant not found" },
          { status: 404 },
        );
      }

      const requiresAuthorization =
        caller.gender === "male" && participant.gender === "female";

      if (requiresAuthorization) {
        const authorizedCallers = (participant.callAuthorizedFor ?? []).map(
          (id) => id.toString(),
        );
        const isAuthorized = authorizedCallers.includes(authResult.user.userId);

        let hasRecentInviteFromParticipant = false;

        // Keep initiation checks strict, but allow joining a recently invited call.
        if (!isAuthorized && !validateOnly) {
          const recentInviteThreshold = new Date(
            Date.now() - RECENT_CALL_INVITE_WINDOW_MS,
          );

          const recentInvite = await Message.findOne({
            senderId: participantId,
            receiverId: authResult.user.userId,
            contentType: "call_invite",
            isDeleted: false,
            createdAt: { $gte: recentInviteThreshold },
          })
            .select("_id")
            .lean();

          hasRecentInviteFromParticipant = !!recentInvite;
        }

        if (!isAuthorized && !hasRecentInviteFromParticipant) {
          return NextResponse.json(
            {
              error: "Call not authorized by this user",
              code: "CALL_NOT_AUTHORIZED",
            },
            { status: 403 },
          );
        }
      }
    }

    if (validateOnly) {
      return NextResponse.json({ success: true, canCall: true });
    }

    const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

    // Upsert the caller in Stream
    await client.upsertUsers([
      {
        id: authResult.user.userId,
        name: caller?.name || "User",
        image: caller?.photos?.[0] || "",
      },
    ]);

    // Upsert the participant if provided
    if (participantId && participant) {
      await client.upsertUsers([
        {
          id: participantId,
          name: participant.name || "User",
          image: participant.photos?.[0] || "",
        },
      ]);
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
