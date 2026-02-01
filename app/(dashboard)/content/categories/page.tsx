'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

const MOCK_CATEGORIES = [
    { id: 1, name: 'General', slug: 'general', items: 45, status: 'Active' },
    { id: 2, name: 'Success Stories', slug: 'success-stories', items: 12, status: 'Active' },
    { id: 3, name: 'Tips & Advice', slug: 'tips-advice', items: 28, status: 'Active' },
    { id: 4, name: 'Platform News', slug: 'platform-news', items: 8, status: 'Hidden' },
];

export default function CategoriesPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Categories</h1>
                    <p className="text-xs text-gray-500 mt-1">Organize content into logical groups.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Category Form (Simplified inline) */}
                <div className="bg-white p-6 rounded-[30px] border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-900 mb-4 text-sm">Add New Category</h3>
                    <div className="space-y-4">
                        <Input label="Name" placeholder="e.g. Health & Wellness" />
                        <Input label="Slug" placeholder="e.g. health-wellness" />
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700 ml-1">Description</label>
                            <textarea className="block w-full rounded-[20px] border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3}></textarea>
                        </div>
                        <Button fullWidth size="md" className="rounded-full mt-2">Add Category</Button>
                    </div>
                </div>

                {/* Categories List */}
                <div className="lg:col-span-2">
                    <Table
                        data={MOCK_CATEGORIES}
                        keyExtractor={(cat) => cat.id}
                        columns={[
                            {
                                header: 'Name',
                                accessor: (cat) => (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary-50 text-secondary rounded-full">
                                            <Tag size={12} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-xs">{cat.name}</p>
                                            <p className="text-[10px] text-gray-500">/{cat.slug}</p>
                                        </div>
                                    </div>
                                )
                            },
                            { header: 'Items', accessor: (cat) => `${cat.items} items` },
                            {
                                header: 'Status',
                                accessor: (cat) => (
                                    <Badge variant={cat.status === 'Active' ? 'success' : 'neutral'}>{cat.status}</Badge>
                                )
                            },
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
            </div>
        </div>
    );
}
