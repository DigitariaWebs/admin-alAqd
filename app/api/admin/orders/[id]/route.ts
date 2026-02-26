import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Order } from '@/lib/db/models/Order';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/orders/[id] ─────────────────────────────────────────────────

/**
 * GET /api/admin/orders/[id]
 * Get order details by ID
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

        const order = await Order.findById(id).lean();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order._id.toString(),
                orderNumber: order.orderNumber,
                userId: order.userId.toString(),
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                items: order.items,
                subtotal: order.subtotal,
                tax: order.tax,
                total: order.total,
                status: order.status,
                paymentStatus: order.paymentStatus,
                payment: order.payment,
                stripeCustomerId: order.stripeCustomerId,
                subscriptionId: order.subscriptionId,
                planId: order.planId,
                metadata: order.metadata,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                completedAt: order.completedAt,
                failedAt: order.failedAt,
                refundedAt: order.refundedAt,
            },
        });
    } catch (error) {
        console.error('Admin get order error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
