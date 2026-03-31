import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ad } from '@/lib/db/models/Ad';
import { Setting } from '@/lib/db/models/Setting';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/ads ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const type = searchParams.get('type'); // banner | interstitial
        const status = searchParams.get('status'); // active | inactive

        const filter: Record<string, unknown> = {};
        if (type) filter.type = type;
        if (status === 'active') filter.isActive = true;
        if (status === 'inactive') filter.isActive = false;

        const [ads, total] = await Promise.all([
            Ad.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Ad.countDocuments(filter),
        ]);

        const settings = await Setting.findOne();
        const adsEnabled = settings?.adsEnabled ?? true;
        const freeSwipeLimit = settings?.freeSwipeLimit ?? 7;

        return NextResponse.json({
            success: true,
            ads,
            adsEnabled,
            freeSwipeLimit,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin get ads error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── POST /api/admin/ads ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { title, description, type, placement, imageUrl, targetUrl, isActive, swipeInterval, startDate, endDate } = body;

        if (!title || !type || !placement || !imageUrl) {
            return NextResponse.json({ error: 'Title, type, placement, and imageUrl are required' }, { status: 400 });
        }

        const ad = await Ad.create({
            title,
            description: description || '',
            type,
            placement,
            imageUrl,
            targetUrl: targetUrl || '',
            isActive: isActive ?? true,
            swipeInterval: swipeInterval ?? 10,
            startDate: startDate || null,
            endDate: endDate || null,
        });

        return NextResponse.json({ success: true, ad }, { status: 201 });
    } catch (error) {
        console.error('Admin create ad error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PUT /api/admin/ads ─────────────────────────────────────────────────────
// Toggle global ads enabled/disabled

export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { adsEnabled, freeSwipeLimit } = body;

        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }

        if (adsEnabled !== undefined) {
            settings.adsEnabled = adsEnabled;
        }
        if (freeSwipeLimit !== undefined) {
            settings.freeSwipeLimit = Math.max(1, freeSwipeLimit);
        }
        await settings.save();

        return NextResponse.json({
            success: true,
            adsEnabled: settings.adsEnabled,
            freeSwipeLimit: settings.freeSwipeLimit,
            message: 'Settings updated',
        });
    } catch (error) {
        console.error('Admin toggle ads error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
