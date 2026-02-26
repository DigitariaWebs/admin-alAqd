import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Content } from '@/lib/db/models/Content';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/content ───────────────────────────────────────────────────

/**
 * GET /api/admin/content
 * List all content (articles, videos, posts, pages)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Filters
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: Record<string, unknown> = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (category) query.category = category;

        // Search
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
            ];
        }

        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [contents, total] = await Promise.all([
            Content.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Content.countDocuments(query),
        ]);

        return NextResponse.json({
            data: contents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content' },
            { status: 500 }
        );
    }
}

// ─── POST /api/admin/content ──────────────────────────────────────────────────

/**
 * POST /api/admin/content
 * Create new content
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const {
            title,
            slug,
            type,
            content,
            excerpt,
            featuredImage,
            author,
            category,
            tags,
            status,
            seoTitle,
            seoDescription,
            order,
        } = body;

        // Validate required fields
        if (!title || !slug || !type || !content || !author) {
            return NextResponse.json(
                { error: 'Title, slug, type, content, and author are required' },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingContent = await Content.findOne({ slug });
        if (existingContent) {
            return NextResponse.json(
                { error: 'Content with this slug already exists' },
                { status: 400 }
            );
        }

        const newContent = new Content({
            title,
            slug,
            type,
            content,
            excerpt,
            featuredImage,
            author,
            category,
            tags,
            status: status || 'draft',
            seoTitle,
            seoDescription,
            order: order || 0,
            publishedAt: status === 'published' ? new Date() : undefined,
        });

        await newContent.save();

        return NextResponse.json(newContent, { status: 201 });
    } catch (error) {
        console.error('Error creating content:', error);
        return NextResponse.json(
            { error: 'Failed to create content' },
            { status: 500 }
        );
    }
}
