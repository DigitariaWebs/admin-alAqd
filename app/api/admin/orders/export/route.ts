import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Order } from '@/lib/db/models/Order';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/orders/export ───────────────────────────────────────────────

/**
 * GET /api/admin/orders/export
 * Export orders report (CSV format)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const authResult = requireRole(request, ['admin', 'moderator']);
        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { searchParams } = new URL(request.url);

        // Filters (same as list)
        const status = searchParams.get('status');
        const paymentStatus = searchParams.get('paymentStatus');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const format = searchParams.get('format') || 'csv';

        // Build query
        const query: Record<string, unknown> = {};

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } },
            ];
        }

        // Get all matching orders (no pagination for export)
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .lean();

        if (format === 'json') {
            return NextResponse.json({
                success: true,
                orders: orders.map(order => ({
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    items: order.items.map((item: { name: string }) => item.name).join(', '),
                    subtotal: order.subtotal,
                    tax: order.tax,
                    total: order.total,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.payment.method,
                    paymentLast4: order.payment.last4,
                    createdAt: order.createdAt,
                    completedAt: order.completedAt,
                })),
                exportedAt: new Date(),
                totalCount: orders.length,
            });
        }

        // CSV format
        const headers = [
            'Order Number',
            'Customer Name',
            'Customer Email',
            'Items',
            'Subtotal',
            'Tax',
            'Total',
            'Status',
            'Payment Status',
            'Payment Method',
            'Card Last 4',
            'Created At',
            'Completed At',
        ];

        const csvRows = [headers.join(',')];

        for (const order of orders) {
            const row = [
                order.orderNumber,
                `"${order.customerName.replace(/"/g, '""')}"`,
                order.customerEmail || '',
                `"${order.items.map((i: { name: string }) => i.name).join(', ').replace(/"/g, '""')}"`,
                order.subtotal.toFixed(2),
                order.tax.toFixed(2),
                order.total.toFixed(2),
                order.status,
                order.paymentStatus,
                order.payment.method,
                order.payment.last4 || '',
                order.createdAt.toISOString(),
                order.completedAt ? order.completedAt.toISOString() : '',
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Admin export orders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
