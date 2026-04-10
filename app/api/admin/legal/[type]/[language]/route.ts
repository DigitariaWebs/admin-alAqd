import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { LegalDocument } from '@/lib/db/models/LegalDocument';
import { requireRole } from '@/lib/auth/middleware';

const ALLOWED_TYPES = ['privacy', 'terms'] as const;
const ALLOWED_LANGUAGES = ['en', 'fr', 'ar', 'es'] as const;

interface RouteParams {
    params: Promise<{ type: string; language: string }>;
}

/**
 * GET /api/admin/legal/:type/:language
 * Fetch a single legal document.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status },
            );
        }

        const { type, language } = await params;
        if (!ALLOWED_TYPES.includes(type as any)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
        if (!ALLOWED_LANGUAGES.includes(language as any)) {
            return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
        }

        const doc = await LegalDocument.findOne({ type, language }).lean();

        if (!doc) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            document: {
                id: (doc as any)._id.toString(),
                type: (doc as any).type,
                language: (doc as any).language,
                title: (doc as any).title,
                content: (doc as any).content,
                version: (doc as any).version,
                updatedAt: (doc as any).updatedAt,
            },
        });
    } catch (error) {
        console.error('Admin legal get error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

/**
 * PUT /api/admin/legal/:type/:language
 * Create or update a legal document. Bumps the version on every successful save.
 * Body: { title: string, content: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status },
            );
        }

        const { type, language } = await params;
        if (!ALLOWED_TYPES.includes(type as any)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
        if (!ALLOWED_LANGUAGES.includes(language as any)) {
            return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
        }

        const body = await request.json();
        const { title, content } = body ?? {};

        if (typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        if (typeof content !== 'string' || !content.trim()) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 },
            );
        }

        const existing = await LegalDocument.findOne({ type, language });

        let saved;
        if (existing) {
            existing.title = title.trim();
            existing.content = content;
            existing.version = (existing.version ?? 1) + 1;
            existing.updatedBy = authResult.user.userId as any;
            saved = await existing.save();
        } else {
            saved = await LegalDocument.create({
                type,
                language,
                title: title.trim(),
                content,
                version: 1,
                updatedBy: authResult.user.userId,
            });
        }

        return NextResponse.json({
            success: true,
            document: {
                id: saved._id.toString(),
                type: saved.type,
                language: saved.language,
                title: saved.title,
                content: saved.content,
                version: saved.version,
                updatedAt: saved.updatedAt,
            },
        });
    } catch (error) {
        console.error('Admin legal update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
