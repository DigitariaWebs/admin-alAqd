import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ad } from '@/lib/db/models/Ad';
import { Setting } from '@/lib/db/models/Setting';
import { requireAuth } from '@/lib/auth/middleware';

// ─── GET /api/ads ───────────────────────────────────────────────────────────
// Returns active ads for the mobile app.
// Query params: type=banner|interstitial, placement=tab_bar|after_swipes

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        // Check global ads toggle
        const settings = await Setting.findOne();
        if (!settings?.adsEnabled) {
            return NextResponse.json({ success: true, ads: [], adsEnabled: false });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const placement = searchParams.get('placement');

        const now = new Date();
        const filter: Record<string, unknown> = {
            isActive: true,
            $or: [
                { startDate: null, endDate: null },
                { startDate: { $lte: now }, endDate: null },
                { startDate: null, endDate: { $gte: now } },
                { startDate: { $lte: now }, endDate: { $gte: now } },
            ],
        };

        if (type) filter.type = type;
        if (placement) filter.placement = placement;

        const ads = await Ad.find(filter)
            .sort({ createdAt: -1 })
            .select('title description type placement imageUrl targetUrl swipeInterval')
            .lean();

        const freeSwipeLimit = settings?.freeSwipeLimit ?? 7;

        return NextResponse.json({ success: true, ads, adsEnabled: true, freeSwipeLimit });
    } catch (error) {
        console.error('Get ads error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
