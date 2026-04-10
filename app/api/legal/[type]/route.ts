import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { LegalDocument } from '@/lib/db/models/LegalDocument';

const ALLOWED_TYPES = ['privacy', 'terms'] as const;
const ALLOWED_LANGUAGES = ['en', 'fr', 'ar', 'es'] as const;

/**
 * GET /api/legal/:type?lang=fr
 * Public endpoint — returns the latest legal document for a given type and
 * language. Falls back to French if the requested language has no entry.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> },
) {
    try {
        await connectDB();

        const { type } = await params;
        if (!ALLOWED_TYPES.includes(type as any)) {
            return NextResponse.json(
                { error: 'Invalid document type' },
                { status: 400 },
            );
        }

        const requestedLang = request.nextUrl.searchParams.get('lang') ?? 'fr';
        const lang = ALLOWED_LANGUAGES.includes(requestedLang as any)
            ? requestedLang
            : 'fr';

        let doc = await LegalDocument.findOne({ type, language: lang }).lean();

        // Fall back to French if the requested language has no entry
        if (!doc && lang !== 'fr') {
            doc = await LegalDocument.findOne({ type, language: 'fr' }).lean();
        }

        if (!doc) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            document: {
                type: doc.type,
                language: doc.language,
                title: doc.title,
                content: doc.content,
                version: doc.version,
                updatedAt: doc.updatedAt,
            },
        });
    } catch (error) {
        console.error('Public legal document fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
