import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { 
    uploadImage, 
    uploadImageAdvanced, 
    uploadVideo, 
    uploadVideoWithThumbnail,
    uploadDocument,
    deleteFile,
    compressImage,
    getMediaUrl,
    getSignedUrl,
    VIDEO_CONFIG,
    DOCUMENT_CONFIG
} from '@/lib/cloudinary';

// ─────────────────────────────────────────────────────────
// Helper: Convert file to base64 data URI
// ─────────────────────────────────────────────────────────
async function fileToDataUri(file: File): Promise<string> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    return `data:${file.type};base64,${base64}`;
}

// ─────────────────────────────────────────────────────────
// POST /api/admin/upload - General upload endpoint
// ─────────────────────────────────────────────────────────

/**
 * POST /api/admin/upload
 * Accepts multipart/form-data with a `file` field.
 * Supports: images, videos, documents
 * Query params:
 *   - type: 'image' | 'video' | 'document' (auto-detected from mime type if not provided)
 *   - folder: custom folder path (default: 'al-aqd/uploads')
 * Returns: { success: true, url, publicId, type, thumbnailUrl? }
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string | null;
        const folder = (formData.get('folder') as string | null) ?? 'al-aqd/uploads';
        
        // Custom options for images
        const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
        const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
        const quality = formData.get('quality') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const mimeType = file.type;
        let result: { url: string; publicId: string; thumbnailUrl?: string };

        // Determine file type
        const fileType = type || (
            mimeType.startsWith('image/') ? 'image' :
            mimeType.startsWith('video/') ? 'video' :
            'document'
        );

        const dataUri = await fileToDataUri(file);

        switch (fileType) {
            case 'image': {
                // Check allowed image types
                const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
                if (!allowedImages.includes(mimeType)) {
                    return NextResponse.json(
                        { error: `Unsupported image type: ${mimeType}. Use JPEG, PNG, WebP, or HEIC.` },
                        { status: 415 }
                    );
                }
                if (file.size > 10 * 1024 * 1024) {
                    return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 413 });
                }

                // Use advanced options if provided
                if (width || height || quality) {
                    result = await uploadImageAdvanced(dataUri, folder, { width, height, quality: quality || undefined });
                } else {
                    result = await uploadImage(dataUri, folder);
                }
                break;
            }

            case 'video': {
                // Check allowed video types
                if (!VIDEO_CONFIG.allowedMimeTypes.includes(mimeType)) {
                    return NextResponse.json(
                        { error: `Unsupported video type: ${mimeType}` },
                        { status: 415 }
                    );
                }
                if (file.size > VIDEO_CONFIG.maxSizeBytes) {
                    return NextResponse.json(
                        { error: `Video exceeds ${VIDEO_CONFIG.maxSizeBytes / (1024 * 1024)} MB limit` },
                        { status: 413 }
                    );
                }

                result = await uploadVideoWithThumbnail(dataUri, folder);
                break;
            }

            case 'document': {
                // Check allowed document types
                if (!DOCUMENT_CONFIG.allowedMimeTypes.includes(mimeType)) {
                    return NextResponse.json(
                        { error: `Unsupported document type: ${mimeType}` },
                        { status: 415 }
                    );
                }
                if (file.size > DOCUMENT_CONFIG.maxSizeBytes) {
                    return NextResponse.json(
                        { error: `Document exceeds ${DOCUMENT_CONFIG.maxSizeBytes / (1024 * 1024)} MB limit` },
                        { status: 413 }
                    );
                }

                result = await uploadDocument(dataUri, folder);
                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
            type: fileType,
            thumbnailUrl: result.thumbnailUrl || null,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
