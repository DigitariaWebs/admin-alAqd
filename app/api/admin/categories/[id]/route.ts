import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Category } from '@/lib/db/models/Category';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/categories/[id] ─────────────────────────────────────────

/**
 * GET /api/admin/categories/[id]
 * Get category details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const category = await Category.findById(id).lean();
        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json(
            { error: 'Failed to fetch category' },
            { status: 500 }
        );
    }
}

// ─── PUT /api/admin/categories/[id] ─────────────────────────────────────────

/**
 * PUT /api/admin/categories/[id]
 * Update category
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;
        const body = await request.json();

        const existingCategory = await Category.findById(id);
        if (!existingCategory) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        // Check if slug is being changed and if it conflicts
        if (body.slug && body.slug !== existingCategory.slug) {
            const slugConflict = await Category.findOne({ slug: body.slug, _id: { $ne: id } });
            if (slugConflict) {
                return NextResponse.json(
                    { error: 'Category with this slug already exists' },
                    { status: 400 }
                );
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

// ─── DELETE /api/admin/categories/[id] ───────────────────────────────────────

/**
 * DELETE /api/admin/categories/[id]
 * Delete category
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { id } = await params;

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}
