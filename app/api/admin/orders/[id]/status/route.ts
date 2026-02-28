import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Order } from '@/lib/db/models/Order';
import { requireRole } from '@/lib/auth/middleware';

// ─── PATCH /api/admin/orders/[id]/status ───────────────────────────────────────

/**
 * PATCH /api/admin/orders/[id]/status
 * Update order status (completed, failed, cancelled, refunded)
 */
export async function PATCH(
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
        const body = await request.json();
        const { status } = body;

        // Validate status
        const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        // First find the order
        const existingOrder = await Order.findById(id).exec();
        
        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Build update data
        const updateData: Record<string, unknown> = {
            status,
            paymentStatus: status === 'completed' ? 'paid' : status === 'failed' ? 'failed' : status === 'refunded' ? 'refunded' : existingOrder.paymentStatus,
        };

        // Set timestamp based on status
        if (status === 'completed') {
            updateData.completedAt = new Date();
        } else if (status === 'failed') {
            updateData.failedAt = new Date();
        } else if (status === 'refunded') {
            updateData.refundedAt = new Date();
        }

        // Update the order
        await Order.updateOne({ _id: id }, { $set: updateData });

        // Fetch the updated order
        const updatedOrder = await Order.findById(id).exec();

        if (!updatedOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            order: {
                id: updatedOrder._id.toString(),
                orderNumber: updatedOrder.orderNumber,
                status: updatedOrder.status,
                paymentStatus: updatedOrder.paymentStatus,
                updatedAt: updatedOrder.updatedAt,
            },
        });
    } catch (error) {
        console.error('Admin update order status error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
