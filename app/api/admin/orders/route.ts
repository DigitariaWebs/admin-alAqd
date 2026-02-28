import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Order } from '@/lib/db/models/Order';
import { requireRole } from '@/lib/auth/middleware';

// Helper to generate order number
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
}

// Helper to generate transaction number
function generateTransactionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRX-${timestamp}${random}`;
}

// ─── GET /api/admin/orders ───────────────────────────────────────────────────

/**
 * GET /api/admin/orders
 * List orders with filters (status, paymentStatus, date range, search)
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
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: Record<string, unknown> = {};

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        // Amount range
        if (minAmount || maxAmount) {
            query.total = {};
            if (minAmount) (query.total as Record<string, number>).$gte = parseFloat(minAmount);
            if (maxAmount) (query.total as Record<string, number>).$lte = parseFloat(maxAmount);
        }

        // Search (order number, customer name, email)
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
            ];
        }

        // Sort
        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        // Calculate stats
        const stats = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    refunded: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] } },
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            orders: orders.map((order) => {
                const o = order as unknown as { _id: { toString(): string } };
                return {
                    id: o._id.toString(),
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    items: order.items,
                    subtotal: order.subtotal,
                    tax: order.tax,
                    total: order.total,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    payment: order.payment,
                    planId: order.planId,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                };
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: stats[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                completed: 0,
                pending: 0,
                failed: 0,
                refunded: 0
            },
        });
    } catch (error) {
        console.error('Admin list orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
