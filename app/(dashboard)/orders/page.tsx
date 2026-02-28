'use client';

import React, { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Eye, Download, Filter, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    items: { name: string; price: number; quantity: number; total: number }[];
    subtotal: number;
    tax: number;
    total: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    payment: { method: string; last4?: string; provider: string };
    planId?: string;
    createdAt: string;
}

interface Stats {
    totalOrders: number;
    totalRevenue: number;
    completed: number;
    pending: number;
    failed: number;
    refunded: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    // Filter states
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '20');
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            if (paymentStatus) params.set('paymentStatus', paymentStatus);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

            const response = await fetch(`/api/admin/orders?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            const data = await response.json();

            if (data.success) {
                setOrders(data.orders);
                setStats(data.stats);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOrders(1);
    };

    const handlePageChange = (newPage: number) => {
        fetchOrders(newPage);
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPaymentStatus('');
        setStartDate('');
        setEndDate('');
        fetchOrders(1);
    };

    const handleExport = async (format: 'csv' | 'json' = 'csv') => {
        try {
            const params = new URLSearchParams();
            if (status) params.set('status', status);
            if (paymentStatus) params.set('paymentStatus', paymentStatus);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            params.set('format', format);

            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

            const response = await fetch(`/api/admin/orders/export?${params.toString()}`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });
            if (format === 'csv') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
            case 'cancelled':
            case 'refunded':
                return 'error';
            default:
                return 'neutral';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const hasActiveFilters = search || status || paymentStatus || startDate || endDate;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Orders & Transactions</h1>
                    <p className="text-xs text-gray-500 mt-1">Track and manage financial transactions.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="md"
                        className="gap-2 rounded-full"
                        onClick={() => handleExport('csv')}
                    >
                        <Download size={16} />
                        <span>Export CSV</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="md"
                        className="gap-2 rounded-full"
                        onClick={() => handleExport('json')}
                    >
                        <Download size={16} />
                        <span>Export JSON</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Orders</p>
                        <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Total Revenue</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Pending</p>
                        <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                        <p className="text-xs text-gray-500">Failed</p>
                        <p className="text-xl font-bold text-red-600">{stats.failed}</p>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-[20px] p-4 border border-gray-100">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by order number, customer name, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" variant="primary" size="md" className="rounded-full">
                            Search
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="md"
                            className="rounded-full gap-2"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="md"
                                className="rounded-full gap-1"
                                onClick={clearFilters}
                            >
                                <X size={16} />
                                Clear
                            </Button>
                        )}
                    </div>
                </form>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            label="Order Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            options={[
                                { value: '', label: 'All Statuses' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'failed', label: 'Failed' },
                                { value: 'cancelled', label: 'Cancelled' },
                                { value: 'refunded', label: 'Refunded' },
                            ]}
                        />
                        <Select
                            label="Payment Status"
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            options={[
                                { value: '', label: 'All Payments' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'paid', label: 'Paid' },
                                { value: 'failed', label: 'Failed' },
                                { value: 'refunded', label: 'Refunded' },
                            ]}
                        />
                        <Input
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No orders found.</p>
                </div>
            ) : (
                <Table
                    data={orders}
                    keyExtractor={(order) => order.id}
                    columns={[
                        {
                            header: 'Order ID',
                            accessor: (order) => (
                                <span className="font-mono text-xs text-gray-500">{order.orderNumber}</span>
                            ),
                        },
                        { header: 'Customer', accessor: 'customerName' },
                        {
                            header: 'Items',
                            accessor: (order) => (
                                <span className="text-sm">{order.items[0]?.name || '-'}</span>
                            ),
                        },
                        {
                            header: 'Date',
                            accessor: (order) => formatDate(order.createdAt),
                        },
                        {
                            header: 'Amount',
                            accessor: (order) => (
                                <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                            ),
                        },
                        {
                            header: 'Status',
                            accessor: (order) => (
                                <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                            ),
                        },
                        {
                            header: 'Payment',
                            accessor: (order) => (
                                <Badge variant={getStatusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                            ),
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
                            ),
                        },
                    ]}
                />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
