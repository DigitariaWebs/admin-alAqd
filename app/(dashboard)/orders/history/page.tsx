'use client';

import React from 'react';
import { table } from 'console';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const TRANSACTIONS = [
    { id: 'TRX-9981', type: 'Credit', amount: '+$500.00', date: 'Oct 24, 2023', description: 'Wallet Top-up', status: 'Completed' },
    { id: 'TRX-9982', type: 'Debit', amount: '-$120.00', date: 'Oct 25, 2023', description: 'Subscription Payment', status: 'Completed' },
    { id: 'TRX-9983', type: 'Credit', amount: '+$50.00', date: 'Oct 26, 2023', description: 'Referral Bonus', status: 'Completed' },
    { id: 'TRX-9984', type: 'Debit', amount: '-$15.00', date: 'Oct 27, 2023', description: 'Profile Boost', status: 'Pending' },
];

export default function TransactionHistoryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Transaction History</h1>
                    <p className="text-xs text-gray-500 mt-1">Global financial ledger of the platform.</p>
                </div>
                <Button variant="outline" size="md" className="gap-2 rounded-full">
                    <Download size={16} />
                    <span>Export Ledger</span>
                </Button>
            </div>

            <Table
                data={TRANSACTIONS}
                keyExtractor={(t) => t.id}
                columns={[
                    { header: 'Reference', accessor: 'id' },
                    {
                        header: 'Type',
                        accessor: (t) => (
                            <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-full ${t.type === 'Credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {t.type === 'Credit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                </div>
                                <span>{t.type}</span>
                            </div>
                        )
                    },
                    { header: 'Description', accessor: 'description' },
                    { header: 'Date', accessor: 'date' },
                    {
                        header: 'Amount',
                        accessor: (t) => (
                            <span className={`font-bold ${t.type === 'Credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                {t.amount}
                            </span>
                        )
                    },
                    {
                        header: 'Status',
                        accessor: (t) => <Badge variant={t.status === 'Completed' ? 'success' : 'warning'}>{t.status}</Badge>
                    }
                ]}
            />
        </div>
    );
}
