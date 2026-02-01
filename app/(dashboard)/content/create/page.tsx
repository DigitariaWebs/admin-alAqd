'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';

export default function CreateContentPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/content" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Create New Content</h1>
                        <p className="text-xs text-gray-500">Fill in the details below to create new content.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="md" className="rounded-full">Cancel</Button>
                    <Button size="md" className="gap-2 rounded-full">
                        <Save size={16} />
                        <span>Save Draft</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <Card className="lg:col-span-2 space-y-6 rounded-[30px] p-8">
                    <Input
                        label="Content Title"
                        placeholder="Enter a descriptive title"
                        className="text-lg font-medium"
                    />

                    <Textarea
                        label="Content Body"
                        placeholder="Write your content here..."
                        rows={12}
                        className="font-normal"
                    />
                </Card>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <Card className="rounded-[30px] p-6 space-y-4">
                        <h3 className="font-semibold text-sm mb-2">Publishing</h3>

                        <Select
                            label="Content Type"
                            options={[
                                { value: 'article', label: 'Article' },
                                { value: 'video', label: 'Video' },
                                { value: 'post', label: 'Post' },
                            ]}
                        />

                        <Select
                            label="Status"
                            options={[
                                { value: 'draft', label: 'Draft' },
                                { value: 'published', label: 'Published' },
                                { value: 'review', label: 'Pending Review' },
                            ]}
                        />

                        <Select
                            label="Category"
                            options={[
                                { value: 'general', label: 'General' },
                                { value: 'news', label: 'News' },
                                { value: 'tips', label: 'Tips & Advice' },
                            ]}
                        />

                        <div className="pt-4 mt-4 border-t border-gray-50">
                            <Button fullWidth size="md" className="rounded-full">Publish Now</Button>
                        </div>
                    </Card>

                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm mb-4">Featured Image</h3>
                        <div className="border-2 border-dashed border-gray-200 rounded-[20px] h-32 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:bg-primary-50 hover:text-primary transition-all cursor-pointer">
                            <UploadCloud size={24} className="mb-2" />
                            <span className="text-xs">Click to upload</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
