import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Category } from '@/lib/db/models/Category';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/categories ───────────────────────────────────────────────

/**
 * GET /api/admin/categories
 * List content categories
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Filters
        const type = searchParams.get('type');
        const isActive = searchParams.get('isActive');

        // Build query
        const query: Record<string, unknown> = {};

        if (type) query.type = type;
        if (isActive !== null && isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const categories = await Category.find(query)
            .sort({ order: 1, name: 1 })
            .lean();

        return NextResponse.json({ data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

// ─── POST /api/admin/categories ─────────────────────────────────────────────

/**
 * POST /api/admin/categories
 * Create category
 */
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const body = await request.json();

        const { name, slug, description, type, parentId, order, isActive } = body;

        // Validate required fields
        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return NextResponse.json(
                { error: 'Category with this slug already exists' },
                { status: 400 }
            );
        }

        const newCategory = new Category({
            name,
            slug,
            description,
            type: type || 'all',
            parentId,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
        });

        await newCategory.save();

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
