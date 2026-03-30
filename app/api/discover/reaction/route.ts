import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { Match } from '@/lib/db/models/Match';
import { Reaction } from '@/lib/db/models/Reaction';
import { requireAuth } from '@/lib/auth/middleware';
import { computeCompatibility } from '@/lib/discover/helpers';
import { getFeaturesForUser } from "@/lib/subscription/plans";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAuth(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    const body = await request.json();
    const { targetUserId, emoji, message } = body;

    if (!targetUserId || !emoji) {
      return NextResponse.json(
        { error: "targetUserId and emoji are required" },
        { status: 400 },
      );
    }

    const currentUserId = authResult.user.userId;

    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot react to your own profile" },
        { status: 400 },
      );
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [currentUser, targetUser, existingSwipe] = await Promise.all([
      User.findById(currentUserId).select(
        "subscription interests religiousPractice",
      ),
      User.findById(targetUserId).select(
        "name photos status interests religiousPractice",
      ),
      Swipe.findOne({ fromUser: currentUserId, toUser: targetUserId })
        .select("_id")
        .lean(),
    ]);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser || targetUser.status === "banned") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sub = currentUser.subscription;
    const isExpired = sub?.endDate ? new Date(sub.endDate) < new Date() : false;
    const activeSubscription = sub?.isActive && !isExpired ? sub : undefined;
    const features = getFeaturesForUser({
      plan: activeSubscription?.plan,
      isActive: Boolean(activeSubscription?.isActive),
    });
    const swipeLimit = features.dailySwipes;

    if (swipeLimit !== -1 && !existingSwipe) {
      const usedToday = await Swipe.countDocuments({
        fromUser: currentUserId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });

      if (usedToday >= swipeLimit) {
        return NextResponse.json(
          {
            error:
              "Daily swipe limit reached. Upgrade your membership to keep swiping.",
            code: "SWIPE_LIMIT_REACHED",
            details: {
              limit: swipeLimit,
              used: usedToday,
              remaining: 0,
              requiresMembership: true,
            },
          },
          { status: 402 },
        );
      }
    }

    // Store the reaction
    await Reaction.findOneAndUpdate(
      { fromUser: currentUserId, toUser: targetUserId },
      { emoji, message, isRead: false },
      { upsert: true, new: true },
    );

    // Sending a reaction implicitly acts as a "like"
    await Swipe.findOneAndUpdate(
      { fromUser: currentUserId, toUser: targetUserId },
      { action: "like" },
      { upsert: true, new: true },
    );

    // Check if target already liked the current user → it's a match
    const theirSwipe = await Swipe.findOne({
      fromUser: targetUserId,
      toUser: currentUserId,
      action: "like",
    });

    let matched = false;
    let matchId: string | undefined;
    let matchCreatedAt: Date | undefined;

    if (theirSwipe) {
      const [u1, u2] = [currentUserId, targetUserId].sort();

      const sharedInterests = (currentUser.interests ?? []).filter(
        (i: string) => (targetUser.interests ?? []).includes(i),
      );
      const compatibility = computeCompatibility(
        currentUser.interests ?? [],
        currentUser.religiousPractice,
        targetUser.interests ?? [],
        targetUser.religiousPractice,
      );

      const upsertedMatch = await Match.findOneAndUpdate(
        { user1: u1, user2: u2 },
        {
          $setOnInsert: {
            user1: u1,
            user2: u2,
            matchType: "like",
            similarities: sharedInterests,
            compatibility,
          },
          $set: { isActive: true, deletedBy: [] },
        },
        { upsert: true, new: true },
      );

      matched = true;
      matchId = upsertedMatch._id.toString();
      matchCreatedAt = upsertedMatch.createdAt;
    }

    let swipeUsage: {
      limit: number;
      used: number;
      remaining: number;
      isLimited: boolean;
    };
    if (swipeLimit === -1) {
      swipeUsage = {
        limit: -1,
        used: -1,
        remaining: -1,
        isLimited: false,
      };
    } else {
      const usedAfter = await Swipe.countDocuments({
        fromUser: currentUserId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      });
      swipeUsage = {
        limit: swipeLimit,
        used: usedAfter,
        remaining: Math.max(swipeLimit - usedAfter, 0),
        isLimited: true,
      };
    }

    return NextResponse.json({
      success: true,
      emoji,
      matched,
      swipeUsage,
      showMembershipPrompt: swipeUsage.isLimited && swipeUsage.remaining === 0,
      ...(matched && {
        match: {
          id: matchId,
          matchedUser: {
            id: targetUser._id.toString(),
            name: targetUser.name,
            photo: (targetUser.photos ?? [])[0] ?? "",
          },
          matchedAt: matchCreatedAt?.toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
