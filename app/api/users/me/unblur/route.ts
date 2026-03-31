import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';

/**
 * POST /api/users/me/unblur
 * Toggle unblur for a specific user.
 * Body: { targetUserId: string }
 * Returns: { unblurred: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authResult = requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    const user = await User.findById(authResult.user.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.gender !== 'female') {
      return NextResponse.json({ error: 'Only female users can manage photo blur' }, { status: 403 });
    }

    const currentList = (user.unblurredFor ?? []).map((id: any) => id.toString());
    const isCurrentlyUnblurred = currentList.includes(targetUserId);

    if (isCurrentlyUnblurred) {
      // Re-blur: remove from list
      await User.findByIdAndUpdate(authResult.user.userId, {
        $pull: { unblurredFor: targetUserId },
      });
      return NextResponse.json({ success: true, unblurred: false });
    } else {
      // Unblur: add to list
      await User.findByIdAndUpdate(authResult.user.userId, {
        $addToSet: { unblurredFor: targetUserId },
      });
      return NextResponse.json({ success: true, unblurred: true });
    }
  } catch (error) {
    console.error('Toggle unblur error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
