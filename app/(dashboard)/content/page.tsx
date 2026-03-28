'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContent, deleteContent, updateContentStatus } from '@/store/slices/contentSlice';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit, Trash2, FileText, Image, Video, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ContentPage() {
    const dispatch = useAppDispatch();
    const { items, isLoading, pagination } = useAppSelector(state => state.content.content);
    
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        search: '',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchContent({
            page: currentPage,
            limit: 20,
            type: filters.type || undefined,
            status: filters.status || undefined,
            search: filters.search || undefined,
        }));
    }, [dispatch, currentPage, filters.type, filters.status, filters.search]);

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        await dispatch(deleteContent(deleteTargetId));
        dispatch(fetchContent({ page: currentPage, limit: 20 }));
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'pending') => {
        await dispatch(updateContentStatus({ id, status }));
        dispatch(fetchContent({ page: currentPage, limit: 20 }));
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={14} className="text-blue-500" />;
            case 'image': return <Image size={14} className="text-purple-500" />;
            default: return <FileText size={14} className="text-gray-500" />;
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'published': return 'success';
            case 'draft': return 'neutral';
            case 'pending': return 'warning';
            default: return 'neutral';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const tableData = items.map(item => ({
        ...item,
        id: item._id,
        date: item.createdAt,
    }));

    if (isLoading && items.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

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

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="w-40">
                    <Select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        options={[
                            { value: '', label: 'All Types' },
                            { value: 'article', label: 'Article' },
                            { value: 'video', label: 'Video' },
                            { value: 'post', label: 'Post' },
                            { value: 'page', label: 'Page' },
                        ]}
                    />
                </div>
                <div className="w-40">
                    <Select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        options={[
                            { value: '', label: 'All Status' },
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'pending', label: 'Pending' },
                        ]}
                    />
                </div>
                <div className="flex-1 min-w-50">
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            <Table
                data={tableData}
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
                                    <p className="text-[10px] text-gray-500 capitalize">{item.type}</p>
                                </div>
                            </div>
                        )
                    },
                    { 
                        header: 'Author', 
                        accessor: (item) => item.author || '—' 
                    },
                    {
                        header: 'Status',
                        accessor: (item) => (
                            <Badge variant={getStatusVariant(item.status) as 'success' | 'neutral' | 'warning'}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                        )
                    },
                    { 
                        header: 'Date', 
                        accessor: (item) => formatDate(item.date) 
                    },
                    { 
                        header: 'Views', 
                        accessor: (item) => (item.viewCount || 0).toLocaleString() 
                    },
                    {
                        header: 'Actions',
                        className: 'text-right',
                        accessor: (item) => (
                            <div className="flex items-center justify-end gap-2">
                                <Link href={`/content/edit/${item.id}`}>
                                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <Edit size={14} />
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )
                    }
                ]}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center text-sm text-gray-500">
                        Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= pagination.totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }}
                title="Confirmer la suppression"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} className="rounded-full">
                            Annuler
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="rounded-full">
                            Supprimer
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
