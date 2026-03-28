'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ONBOARDING_DATA } from '@/config/onboarding-data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft, Plus, Trash2, Edit, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function AttributeDetailPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = React.use(params);

    interface Attribute {
        id: string;
        name: string;
        group?: string;
        status: string;
    }

    // Flatten data for table
    const getData = (): Attribute[] => {
        if (category === 'interests') {
            const interests = ONBOARDING_DATA.interests as Record<string, string[]>;
            let flat: Attribute[] = [];
            Object.entries(interests).forEach(([group, items]) => {
                items.forEach(item => {
                    flat.push({ id: item, name: item, group: group, status: 'Active' });
                });
            });
            return flat;
        }

        // Default array handling (personality, faith)
        const list = (ONBOARDING_DATA as any)[category] || [];
        return list.map((item: string) => ({
            id: item,
            name: item,
            group: 'General',
            status: 'Active'
        }));
    };

    const [data, setData] = useState<Attribute[]>(getData());
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState('');
    const [newGroup, setNewGroup] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newItem) return;
        setData([{ id: newItem.toLowerCase().replace(/\s/g, ''), name: newItem, group: newGroup || 'General', status: 'Active' }, ...data]);
        setNewItem('');
        setNewGroup('');
        setShowAddForm(false);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        setData(data.filter((i) => i.id !== deleteTargetId));
        setIsDeleteModalOpen(false);
        setDeleteTargetId(null);
    };

    const getTitle = () => {
        switch (category) {
            case 'personality': return 'Personality Traits';
            case 'faith': return 'Faith Practices';
            case 'interests': return 'Interests & Hobbies';
            case 'habits': return 'Living Habits';
            default: return 'Attributes';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/content/onboarding" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 capitalize">{getTitle()}</h1>
                        <p className="text-xs text-gray-500 mt-1">Manage the available options for {category}.</p>
                    </div>
                </div>
                <Button size="md" className="gap-2 rounded-full" onClick={() => setShowAddForm(true)}>
                    <Plus size={16} />
                    <span>Add Option</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {showAddForm && (
                    <div className="lg:col-span-3">
                        <Card className="p-6 rounded-[30px] border border-primary/20 bg-primary/5">
                            <h3 className="font-bold text-gray-900 mb-4 text-sm">Add New Option</h3>
                            <div className="flex flex-col sm:flex-row gap-4 items-end">
                                <Input
                                    label="Option Name (Key)"
                                    placeholder="e.g. Hiking"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    className="bg-white mb-0"
                                />
                                {category === 'interests' && (
                                    <Input
                                        label="Group"
                                        placeholder="e.g. Outdoor"
                                        value={newGroup}
                                        onChange={(e) => setNewGroup(e.target.value)}
                                        className="bg-white mb-0"
                                    />
                                )}
                                <div className="flex gap-2 pb-1">
                                    <Button size="md" className="rounded-full" onClick={handleAdd}>Save</Button>
                                    <Button variant="outline" size="md" className="rounded-full" onClick={() => setShowAddForm(false)}>Cancel</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                <div className="lg:col-span-3">
                    <Table<Attribute>
                        data={data}
                        keyExtractor={(item) => item.id}
                        columns={[
                            {
                                header: 'Tag Name',
                                accessor: (item) => (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 text-gray-500 rounded-lg">
                                            <Tag size={14} />
                                        </div>
                                        <span className="font-medium text-gray-900 text-xs">{item.name}</span>
                                    </div>
                                )
                            },
                            ...(category === 'interests' ? [{ header: 'Group', accessor: 'group' as keyof Attribute }] : []),
                            {
                                header: 'Status',
                                accessor: (item) => <Badge variant="success" size="sm" className="rounded-full">{item.status}</Badge>
                            },
                            {
                                header: 'Actions',
                                className: 'text-right',
                                accessor: (item) => (
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            onClick={() => handleDeleteClick(item.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }}
                title="Confirmer la suppression"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Êtes-vous sûr de vouloir supprimer cette option ? Cette action est irréversible.
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
