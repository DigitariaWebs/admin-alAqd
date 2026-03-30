import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { Swipe } from '@/lib/db/models/Swipe';
import { Match } from '@/lib/db/models/Match';
import { requireAuth } from '@/lib/auth/middleware';
import { computeCompatibility } from '@/lib/discover/helpers';
import { getPrimaryPhotoForViewer } from '@/lib/privacy/photos';
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
    const { targetUserId, action } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "targetUserId and action are required" },
        { status: 400 },
      );
    }

    if (!["like", "pass"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be like or pass" },
        { status: 400 },
      );
    }

    const currentUserId = authResult.user.userId;

    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot swipe on yourself" },
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
        "name gender photos photoBlurEnabled status interests religiousPractice isPhoneVerified isEmailVerified subscription lastActive dateOfBirth location",
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

    // Upsert the swipe — idempotent (re-swiping updates the action)
    await Swipe.findOneAndUpdate(
      { fromUser: currentUserId, toUser: targetUserId },
      { action },
      { upsert: true, new: true },
    );

    let matched = false;
    let matchId: string | undefined;
    let matchCreatedAt: Date | undefined;

    if (action === "like") {
      // Check if the target already liked back
      const theirSwipe = await Swipe.findOne({
        fromUser: targetUserId,
        toUser: currentUserId,
        action: "like",
      });

      if (theirSwipe) {
        // It's a match — sort IDs so (user1, user2) is always deterministic
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
              matchType: action,
              isActive: true,
              similarities: sharedInterests,
              compatibility,
            },
          },
          { upsert: true, new: true },
        );

        matched = true;
        matchId = upsertedMatch._id.toString();
        matchCreatedAt = upsertedMatch.createdAt;
      }
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
      action,
      matched,
      swipeUsage,
      showMembershipPrompt: swipeUsage.isLimited && swipeUsage.remaining === 0,
      ...(matched && {
        match: {
          id: matchId,
          matchedUser: {
            id: targetUser._id.toString(),
            name: targetUser.name,
            photo: getPrimaryPhotoForViewer({
              photos: targetUser.photos ?? [],
              targetGender: targetUser.gender,
              blurEnabled: targetUser.photoBlurEnabled,
              isOwner: false,
            }),
          },
          matchedAt: matchCreatedAt?.toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error("Swipe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
