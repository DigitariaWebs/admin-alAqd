import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { uploadImage, uploadImageAdvanced } from '@/lib/cloudinary';

// ─────────────────────────────────────────────────────────
// POST /api/admin/upload/image
// ─────────────────────────────────────────────────────────

/**
 * POST /api/admin/upload/image
 * Upload an image file
 * Form data:
 *   - file: File (required)
 *   - folder: string (optional, default: 'al-aqd/uploads')
 *   - width: number (optional)
 *   - height: number (optional)
 *   - quality: string (optional)
 * Returns: { success: true, url, publicId }
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string | null) ?? 'al-aqd/uploads';
        
        const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined;
        const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined;
        const quality = formData.get('quality') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or HEIC.` },
                { status: 415 }
            );
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        let result: { url: string; publicId: string };

        if (width || height || quality) {
            result = await uploadImageAdvanced(dataUri, folder, { width, height, quality: quality || undefined });
        } else {
            result = await uploadImage(dataUri, folder);
        }

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
        });
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }
}
