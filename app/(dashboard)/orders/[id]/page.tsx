'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Printer, FileText, CreditCard, User } from 'lucide-react';

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    // Mock data for order {params.id}
    const order = {
        id: params.id,
        status: 'Completed',
        date: 'November 20, 2023 at 10:42 AM',
        customer: {
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            id: 'USR-8821'
        },
        payment: {
            method: 'Credit Card',
            last4: '4242',
            provider: 'Stripe'
        },
        items: [
            { id: 1, name: 'Premium Subscription (1 Year)', price: '$120.00', quantity: 1, total: '$120.00' }
        ],
        subtotal: '$120.00',
        tax: '$0.00',
        total: '$120.00',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            Order #{order.id}
                            <Badge variant="success" size="sm">{order.status}</Badge>
                        </h1>
                        <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="md" className="rounded-full gap-2">
                        <Printer size={16} />
                        Print Invoice
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-[30px] overflow-hidden p-0">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="font-semibold text-sm text-gray-900">Order Items</h3>
                        </div>
                        <div className="p-6">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                                        <th className="pb-4 font-medium">Item</th>
                                        <th className="pb-4 font-medium text-center">Qty</th>
                                        <th className="pb-4 font-medium text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-4 text-gray-900 font-medium">{item.name}</td>
                                            <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                                            <td className="py-4 text-right text-gray-900">{item.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2} className="pt-6 text-right text-gray-500 text-xs">Subtotal</td>
                                        <td className="pt-6 text-right font-medium text-gray-900">{order.subtotal}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="pt-2 text-right text-gray-500 text-xs">Tax</td>
                                        <td className="pt-2 text-right font-medium text-gray-900">{order.tax}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} className="pt-4 text-right text-gray-900 font-bold text-lg">Total</td>
                                        <td className="pt-4 text-right font-bold text-primary text-lg">{order.total}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            Customer Details
                        </h3>
                        <div className="space-y-1">
                            <p className="font-medium text-sm text-gray-900">{order.customer.name}</p>
                            <p className="text-xs text-blue-500">{order.customer.email}</p>
                            <p className="text-xs text-gray-400 mt-2">ID: {order.customer.id}</p>
                        </div>
                    </Card>

                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-gray-400" />
                            Payment Information
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[20px]">
                            <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                                Card
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-900">•••• {order.payment.last4}</p>
                                <p className="text-[10px] text-gray-500">via {order.payment.provider}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
