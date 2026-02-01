'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit, Trash2, FileText, Image, Video } from 'lucide-react';
import Link from 'next/link';

const MOCK_CONTENT = [
    { id: 1, title: 'Welcome to Al-Aqd', type: 'Article', author: 'Sarah Wilson', status: 'Published', date: '2023-11-01', views: 1240 },
    { id: 2, title: 'How to use the platform', type: 'Video', author: 'Admin', status: 'Draft', date: '2023-11-05', views: 0 },
    { id: 3, title: 'Success Story: Ahmed & Fatima', type: 'Post', author: 'Ahmed Hassan', status: 'Pending Review', date: '2023-11-10', views: 0 },
    { id: 4, title: 'Premium Membership Benefits', type: 'Article', author: 'Admin', status: 'Published', date: '2023-10-15', views: 5430 },
    { id: 5, title: 'Community Guidelines', type: 'Page', author: 'System', status: 'Published', date: '2023-09-01', views: 890 },
];

export default function ContentPage() {
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Video': return <Video size={14} className="text-blue-500" />;
            case 'Image': return <Image size={14} className="text-purple-500" />;
            default: return <FileText size={14} className="text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Content Management</h1>
                    <p className="text-xs text-gray-500 mt-1">Create, edit, and manage platform content.</p>
                </div>
                <Link href="/content/create">
                    <Button size="md" className="gap-2 rounded-full">
                        <Plus size={16} />
                        <span>Create Content</span>
                    </Button>
                </Link>
            </div>

            <Table
                data={MOCK_CONTENT}
                keyExtractor={(item) => item.id}
                columns={[
                    {
                        header: 'Title',
                        accessor: (item) => (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    {getTypeIcon(item.type)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-xs">{item.title}</p>
                                    <p className="text-[10px] text-gray-500">{item.type}</p>
                                </div>
                            </div>
                        )
                    },
                    { header: 'Author', accessor: 'author' },
                    {
                        header: 'Status',
                        accessor: (item) => (
                            <Badge
                                variant={
                                    item.status === 'Published' ? 'success' :
                                        item.status === 'Draft' ? 'neutral' : 'warning'
                                }
                            >
                                {item.status}
                            </Badge>
                        )
                    },
                    { header: 'Date', accessor: 'date' },
                    { header: 'Views', accessor: (item) => item.views.toLocaleString() },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: () => (
                            <div className="flex items-center justify-end gap-2">
                                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                    <Edit size={14} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
}
