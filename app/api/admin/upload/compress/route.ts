import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { compressImage, getMediaUrl, getSignedUrl } from '@/lib/cloudinary';

// ─────────────────────────────────────────────────────────
// POST /api/admin/upload/compress
// ─────────────────────────────────────────────────────────

/**
 * POST /api/admin/upload/compress
 * Compress/optimize an existing image
 * Body: { 
 *   publicId: string,
 *   quality?: string (default: 'auto:good')
 *   format?: string (default: 'auto')
 * }
 * Returns: { success: true, url, publicId }
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();
        const { publicId, quality, format } = body;

        if (!publicId) {
            return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
        }

        const result = await compressImage(publicId, { quality, format });

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
        });
    } catch (error) {
        console.error('Compress error:', error);
        return NextResponse.json({ error: 'Compression failed' }, { status: 500 });
    }
}

// ─────────────────────────────────────────────────────────
// GET /api/admin/upload/compress
// ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/upload/compress
 * Get a media URL (for CDN delivery)
 * Query params:
 *   - publicId: string (required)
 *   - resourceType: 'image' | 'video' | 'raw' | 'auto' (default: 'auto')
 *   - format: string (optional)
 *   - width: number (optional)
 *   - height: number (optional)
 * Returns: { url: string }
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);
        const publicId = searchParams.get('publicId');

        if (!publicId) {
            return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
        }

        const options = {
            resourceType: (searchParams.get('resourceType') as 'image' | 'video' | 'raw' | 'auto') || undefined,
            format: searchParams.get('format') || undefined,
            width: searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined,
            height: searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined,
        };

        const url = getMediaUrl(publicId, options);

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Get media URL error:', error);
        return NextResponse.json({ error: 'Failed to get media URL' }, { status: 500 });
    }
}
