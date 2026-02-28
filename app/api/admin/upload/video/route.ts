import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { uploadVideo, uploadVideoWithThumbnail, VIDEO_CONFIG } from '@/lib/cloudinary';

// ─────────────────────────────────────────────────────────
// POST /api/admin/upload/video
// ─────────────────────────────────────────────────────────

/**
 * POST /api/admin/upload/video
 * Upload a video file
 * Form data:
 *   - file: File (required)
 *   - folder: string (optional, default: 'al-aqd/videos')
 *   - generateThumbnail: boolean (optional, default: true)
 * Returns: { success: true, url, publicId, thumbnailUrl? }
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string | null) ?? 'al-aqd/videos';
        const generateThumbnail = formData.get('generateThumbnail') !== 'false';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = VIDEO_CONFIG.allowedMimeTypes;
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported video type: ${file.type}` },
                { status: 415 }
            );
        }

        if (file.size > VIDEO_CONFIG.maxSizeBytes) {
            return NextResponse.json(
                { error: `Video exceeds ${VIDEO_CONFIG.maxSizeBytes / (1024 * 1024)} MB limit` },
                { status: 413 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        let result: { url: string; publicId: string; thumbnailUrl?: string };

        if (generateThumbnail) {
            result = await uploadVideoWithThumbnail(dataUri, folder);
        } else {
            const uploadResult = await uploadVideo(dataUri, folder);
            result = { url: uploadResult.url, publicId: uploadResult.publicId };
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
            thumbnailUrl: result.thumbnailUrl || null,
        });
    } catch (error) {
        console.error('Video upload error:', error);
        return NextResponse.json({ error: 'Video upload failed' }, { status: 500 });
    }
}
