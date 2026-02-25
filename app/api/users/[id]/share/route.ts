import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

const APP_BASE_URL = process.env.APP_BASE_URL || 'https://al-aqd.app';

/**
 * GET /api/users/:id/share
 * Returns a shareable deep-link URL and a ready-made share message
 * for the given user's public profile.
 */
export async function GET(request: NextRequest, { params }: Params) {
    try {
        await connectDB();

        // Auth not strictly required for share links, but we log who generated it
        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
        }

        const user = await User.findOne({ _id: id, status: 'active' })
            .select('name photos profession location')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const firstName = (user.name || '').split(' ')[0];
        const tagline   = [user.profession, user.location].filter(Boolean).join(' · ');

        const shareUrl  = `${APP_BASE_URL}/u/${id}`;
        const shareText = tagline
            ? `Découvrez le profil de ${firstName} sur Al-Aqd — ${tagline} 🌙\n${shareUrl}`
            : `Découvrez le profil de ${firstName} sur Al-Aqd 🌙\n${shareUrl}`;

        return NextResponse.json({
            success: true,
            shareUrl,
            shareText,
            name:  user.name,
            photo: (user.photos ?? [])[0] ?? '',
        });
    } catch (error) {
        console.error('Share profile error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
