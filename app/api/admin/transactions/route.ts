import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Transaction } from '@/lib/db/models/Transaction';
import { requireRole } from '@/lib/auth/middleware';

// ─── GET /api/admin/transactions ───────────────────────────────────────────────

/**
 * GET /api/admin/transactions
 * List all transactions with filters
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
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const minAmount = searchParams.get('minAmount');
        const maxAmount = searchParams.get('maxAmount');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Build query
        const query: Record<string, unknown> = {};

        if (type) query.type = type;
        if (status) query.status = status;

        // Date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) (query.createdAt as Record<string, Date>).$gte = new Date(startDate);
            if (endDate) (query.createdAt as Record<string, Date>).$lte = new Date(endDate);
        }

        // Amount range
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) (query.amount as Record<string, number>).$gte = parseFloat(minAmount);
            if (maxAmount) (query.amount as Record<string, number>).$lte = parseFloat(maxAmount);
        }

        // Search (transaction number, description)
        if (search) {
            query.$or = [
                { transactionNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Sort
        const sort: Record<string, 1 | -1> = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('userId', 'name email')
                .populate('orderId', 'orderNumber total')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(query),
        ]);

        // Calculate stats
        const stats = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalCredits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
                    totalDebits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                },
            },
        ]);

        return NextResponse.json({
            success: true,
            transactions: transactions.map((tx) => {
                const t = tx as unknown as { _id: { toString(): string } };
                return {
                    id: t._id.toString(),
                    transactionNumber: tx.transactionNumber,
                    orderId: tx.orderId ? (typeof tx.orderId === 'object' ? { id: (tx.orderId as any)._id?.toString(), orderNumber: (tx.orderId as any).orderNumber } : tx.orderId.toString()) : undefined,
                    userId: tx.userId ? (typeof tx.userId === 'object' ? (tx.userId as any)._id?.toString() : tx.userId.toString()) : undefined,
                    userName: tx.userId && typeof tx.userId === 'object' ? (tx.userId as any).name : undefined,
                    type: tx.type,
                    amount: tx.amount,
                    currency: tx.currency,
                    description: tx.description,
                    status: tx.status,
                    paymentMethod: tx.paymentMethod,
                    last4: tx.last4,
                    provider: tx.provider,
                    createdAt: tx.createdAt,
                    completedAt: tx.completedAt,
                    failedAt: tx.failedAt,
                };
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: stats[0] || {
                totalTransactions: 0,
                totalCredits: 0,
                totalDebits: 0,
                completed: 0,
                pending: 0,
                failed: 0
            },
        });
    } catch (error) {
        console.error('Admin list transactions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
