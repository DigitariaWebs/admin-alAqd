import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ad } from '@/lib/db/models/Ad';
import { requireAuth } from '@/lib/auth/middleware';

// ─── POST /api/ads/:id ─────────────────────────────────────────────────────
// Track impression or click: { action: 'impression' | 'click' }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const authResult = requireAuth(request);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { action } = body;

        if (!['impression', 'click'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const update = action === 'click'
            ? { $inc: { clicks: 1 } }
            : { $inc: { impressions: 1 } };

        await Ad.findByIdAndUpdate(id, update);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track ad error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
