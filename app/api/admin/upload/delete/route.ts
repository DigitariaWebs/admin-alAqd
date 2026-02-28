import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { deleteFile } from '@/lib/cloudinary';

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/upload/delete
// ─────────────────────────────────────────────────────────

/**
 * DELETE /api/admin/upload/delete
 * Body: { publicId: string }
 * Returns: { success: true, deleted: boolean }
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { publicId } = body;

        if (!publicId) {
            return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
        }

        const deleted = await deleteFile(publicId);

        return NextResponse.json({
            success: true,
            deleted,
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
