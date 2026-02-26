import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Content } from '@/lib/db/models/Content';
import { requireRole } from '@/lib/auth/middleware';

// ─── PATCH /api/admin/content/[id]/status ────────────────────────────────────

/**
 * PATCH /api/admin/content/[id]/status
 * Update content status (published/draft/pending)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        // Validate status
        const validStatuses = ['draft', 'published', 'pending'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: draft, published, pending' },
                { status: 400 }
            );
        }

        const content = await Content.findById(id);
        if (!content) {
            return NextResponse.json(
                { error: 'Content not found' },
                { status: 404 }
            );
        }

        // Set publishedAt when status changes to published
        const updateData: Record<string, unknown> = { status };
        if (status === 'published' && content.status !== 'published') {
            updateData.publishedAt = new Date();
        }

        const updatedContent = await Content.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        return NextResponse.json(updatedContent);
    } catch (error) {
        console.error('Error updating content status:', error);
        return NextResponse.json(
            { error: 'Failed to update content status' },
            { status: 500 }
        );
    }
}
