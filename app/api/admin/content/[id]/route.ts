import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Content } from '@/lib/db/models/Content';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/content/[id] ─────────────────────────────────────────────

/**
 * GET /api/admin/content/[id]
 * Get content details
 */
export async function GET(
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

        const content = await Content.findById(id).lean();
        if (!content) {
            return NextResponse.json(
                { error: 'Content not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(content);
    } catch (error) {
        console.error('Error fetching content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content' },
            { status: 500 }
        );
    }
}

// ─── PUT /api/admin/content/[id] ─────────────────────────────────────────────

/**
 * PUT /api/admin/content/[id]
 * Update content
 */
export async function PUT(
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

        const existingContent = await Content.findById(id);
        if (!existingContent) {
            return NextResponse.json(
                { error: 'Content not found' },
                { status: 404 }
            );
        }

        // Check if slug is being changed and if it conflicts
        if (body.slug && body.slug !== existingContent.slug) {
            const slugConflict = await Content.findOne({ slug: body.slug, _id: { $ne: id } });
            if (slugConflict) {
                return NextResponse.json(
                    { error: 'Content with this slug already exists' },
                    { status: 400 }
                );
            }
        }

        // Handle published status change
        if (body.status === 'published' && existingContent.status !== 'published') {
            body.publishedAt = new Date();
        }

        const updatedContent = await Content.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedContent);
    } catch (error) {
        console.error('Error updating content:', error);
        return NextResponse.json(
            { error: 'Failed to update content' },
            { status: 500 }
        );
    }
}

// ─── DELETE /api/admin/content/[id] ─────────────────────────────────────────

/**
 * DELETE /api/admin/content/[id]
 * Delete content
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const content = await Content.findByIdAndDelete(id);
        if (!content) {
            return NextResponse.json(
                { error: 'Content not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json(
            { error: 'Failed to delete content' },
            { status: 500 }
        );
    }
}
