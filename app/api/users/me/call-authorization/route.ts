import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * POST /api/users/me/call-authorization
 * Toggle call authorization for a specific user.
 * Body: { targetUserId: string }
 * Returns: { callAuthorized: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { targetUserId } = await request.json().catch(() => ({}));
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Invalid targetUserId' }, { status: 400 });
    }

    if (targetUserId === authResult.user.userId) {
      return NextResponse.json({ error: 'Cannot change call authorization for yourself' }, { status: 400 });
    }

    const user = await User.findById(authResult.user.userId)
      .select('gender callAuthorizedFor')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.gender !== 'female') {
      return NextResponse.json({ error: 'Only female users can manage call authorization' }, { status: 403 });
    }

    const targetUser = await User.findById(targetUserId)
      .select('gender status')
      .lean();

    if (!targetUser || targetUser.status === 'banned') {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.gender !== 'male') {
      return NextResponse.json({ error: 'Call authorization is only required for male users' }, { status: 400 });
    }

    const currentList = (user.callAuthorizedFor ?? []).map((id: any) => id.toString());
    const isCurrentlyAuthorized = currentList.includes(targetUserId);

    if (isCurrentlyAuthorized) {
      await User.findByIdAndUpdate(authResult.user.userId, {
        $pull: { callAuthorizedFor: targetUserId },
      });
      return NextResponse.json({ success: true, callAuthorized: false });
    }

    await User.findByIdAndUpdate(authResult.user.userId, {
      $addToSet: { callAuthorizedFor: targetUserId },
    });
    return NextResponse.json({ success: true, callAuthorized: true });
  } catch (error) {
    console.error('Toggle call authorization error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
