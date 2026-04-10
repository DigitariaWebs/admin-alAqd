import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { LegalDocument } from '@/lib/db/models/LegalDocument';
import { requireRole } from '@/lib/auth/middleware';

/**
 * GET /api/admin/legal
 * List all legal documents (all types, all languages).
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status },
            );
        }

        const docs = await LegalDocument.find()
            .sort({ type: 1, language: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            documents: docs.map((d: any) => ({
                id: d._id.toString(),
                type: d.type,
                language: d.language,
                title: d.title,
                content: d.content,
                version: d.version,
                updatedAt: d.updatedAt,
                updatedBy: d.updatedBy?.toString(),
            })),
        });
    } catch (error) {
        console.error('Admin legal list error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
