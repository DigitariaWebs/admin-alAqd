'use client';

import React from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Eye, Download } from 'lucide-react';
import Link from 'next/link';

const MOCK_ORDERS = [
    { id: 'ORD-001', customer: 'Sarah Wilson', item: 'Premium Subscription (1 Year)', date: '2023-11-20', amount: '$120.00', status: 'Completed' },
    { id: 'ORD-002', customer: 'Ahmed Hassan', item: 'Profile Boost (7 Days)', date: '2023-11-21', amount: '$15.00', status: 'Pending' },
    { id: 'ORD-003', customer: 'John Doe', item: 'Premium Subscription (1 Month)', date: '2023-11-22', amount: '$12.00', status: 'Failed' },
    { id: 'ORD-004', customer: 'Maria Garcia', item: 'Gift: Rose Bouquet', date: '2023-11-22', amount: '$25.00', status: 'Completed' },
];

export default function OrdersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Orders & Transactions</h1>
                    <p className="text-xs text-gray-500 mt-1">Track and manage financial transactions.</p>
                </div>
                <Button variant="outline" size="md" className="gap-2 rounded-full">
                    <Download size={16} />
                    <span>Export Report</span>
                </Button>
            </div>

            <Table
                data={MOCK_ORDERS}
                keyExtractor={(order) => order.id}
                columns={[
                    {
                        header: 'Order ID',
                        accessor: (order) => <span className="font-mono text-xs text-gray-500">{order.id}</span>
                    },
                    { header: 'Customer', accessor: 'customer' },
                    { header: 'Item', accessor: 'item' },
                    { header: 'Date', accessor: 'date' },
                    {
                        header: 'Amount',
                        accessor: (order) => <span className="font-bold text-gray-900">{order.amount}</span>
                    },
                    {
                        header: 'Status',
                        accessor: (order) => (
                            <Badge
                                variant={
                                    order.status === 'Completed' ? 'success' :
                                        order.status === 'Pending' ? 'warning' : 'error'
                                }
                            >
                                {order.status}
                            </Badge>
                        )
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: (order) => (
                            <div className="flex justify-end">
                                <Link href={`/orders/${order.id}`}>
                                    <button className="flex items-center gap-1 px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-medium text-gray-600 transition-colors">
                                        <Eye size={12} />
                                        View
                                    </button>
                                </Link>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
}
