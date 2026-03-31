import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Ad } from '@/lib/db/models/Ad';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/ads/:id ─────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const ad = await Ad.findById(id).lean();
        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, ad });
    } catch (error) {
        console.error('Admin get ad error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── PUT /api/admin/ads/:id ─────────────────────────────────────────────────

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();

        const allowedFields = ['title', 'description', 'type', 'placement', 'imageUrl', 'targetUrl', 'isActive', 'swipeInterval', 'startDate', 'endDate'];
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        const ad = await Ad.findByIdAndUpdate(id, updates, { new: true }).lean();
        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, ad, message: 'Ad updated successfully' });
    } catch (error) {
        console.error('Admin update ad error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── DELETE /api/admin/ads/:id ──────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const ad = await Ad.findByIdAndDelete(id);
        if (!ad) {
            return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Ad deleted successfully' });
    } catch (error) {
        console.error('Admin delete ad error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
