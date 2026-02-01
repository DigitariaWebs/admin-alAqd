'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, Download, Calendar } from 'lucide-react';

const REPORTS = [
    { id: 1, name: 'Monthly Financial Report', date: 'Oct 2023', type: 'Finance', status: 'Ready' },
    { id: 2, name: 'User Engagement Summary', date: 'Q3 2023', type: 'Analytics', status: 'Ready' },
    { id: 3, name: 'Content Performance Audit', date: 'Sep 2023', type: 'Content', status: 'Ready' },
    { id: 4, name: 'System Security Log', date: 'Oct 2023', type: 'Security', status: 'Processing' },
];

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Reports</h1>
                <p className="text-xs text-gray-500 mt-1">Download and view generated system reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {REPORTS.map((report) => (
                    <Card key={report.id} className="rounded-[25px] flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-gray-50 rounded-[15px] text-gray-500">
                                <FileText size={20} />
                            </div>
                            <Badge variant={report.status === 'Ready' ? 'success' : 'warning'}>{report.status}</Badge>
                        </div>

                        <div>
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                <Calendar size={10} /> {report.date}
                            </p>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{report.name}</h3>
                            <p className="text-[10px] text-gray-500 mt-1">{report.type}</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                fullWidth
                                className="rounded-full gap-2 text-xs"
                                disabled={report.status !== 'Ready'}
                            >
                                <Download size={12} />
                                Download PDF
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
