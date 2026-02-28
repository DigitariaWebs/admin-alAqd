import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { uploadDocument, DOCUMENT_CONFIG } from '@/lib/cloudinary';


export async function POST(request: NextRequest) {
    try {
        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string | null) ?? 'al-aqd/documents';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const allowedTypes = DOCUMENT_CONFIG.allowedMimeTypes;
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Unsupported document type: ${file.type}` },
                { status: 415 }
            );
        }

        if (file.size > DOCUMENT_CONFIG.maxSizeBytes) {
            return NextResponse.json(
                { error: `Document exceeds ${DOCUMENT_CONFIG.maxSizeBytes / (1024 * 1024)} MB limit` },
                { status: 413 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const result = await uploadDocument(dataUri, folder);

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
        });
    } catch (error) {
        console.error('Document upload error:', error);
        return NextResponse.json({ error: 'Document upload failed' }, { status: 500 });
    }
}
