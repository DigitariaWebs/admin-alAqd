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

        // Check global ads toggle (default to enabled if no settings doc exists)
        const settings = await Setting.findOne();
        const adsEnabled = settings?.adsEnabled ?? true;
        if (!adsEnabled) {
            return NextResponse.json({ success: true, ads: [], adsEnabled: false });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const placement = searchParams.get('placement');

        const now = new Date();
        const filter: Record<string, unknown> = {
            isActive: true,
            $or: [
                { startDate: { $in: [null, undefined] }, endDate: { $in: [null, undefined] } },
                { startDate: { $exists: false }, endDate: { $exists: false } },
                { startDate: { $lte: now }, endDate: { $in: [null, undefined] } },
                { startDate: { $lte: now }, endDate: { $exists: false } },
                { startDate: { $in: [null, undefined] }, endDate: { $gte: now } },
                { startDate: { $exists: false }, endDate: { $gte: now } },
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

        return NextResponse.json({ success: true, ads, adsEnabled, freeSwipeLimit });
    } catch (error) {
        console.error('Get ads error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
