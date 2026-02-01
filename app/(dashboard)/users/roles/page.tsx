'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Plus, Shield, Edit, Trash2 } from 'lucide-react';

const MOCK_ROLES = [
    { id: 1, name: 'Super Admin', users: 2, permissions: ['All Access'], description: 'Full system access' },
    { id: 2, name: 'Content Moderator', users: 5, permissions: ['Approve Content', 'Delete Posts'], description: 'Manage user content and reports' },
    { id: 3, name: 'Support Agent', users: 8, permissions: ['View Users', 'Reply Tickets'], description: 'Customer support access' },
    { id: 4, name: 'User', users: 1250, permissions: ['Basic Access'], description: 'Standard user access' },
];

export default function RolesPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Roles & Permissions</h1>
                    <p className="text-xs text-gray-500 mt-1">Manage system roles and their capability levels.</p>
                </div>
                <Button size="md" className="gap-2 rounded-full">
                    <Plus size={16} />
                    <span>Create Role</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Table
                    data={MOCK_ROLES}
                    keyExtractor={(role) => role.id}
                    columns={[
                        {
                            header: 'Role Name',
                            accessor: (role) => (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-50 rounded-full text-primary">
                                        <Shield size={16} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-xs">{role.name}</p>
                                        <p className="text-[10px] text-gray-500">{role.description}</p>
                                    </div>
                                </div>
                            )
                        },
                        {
                            header: 'Users Count',
                            accessor: (role) => (
                                <Badge variant="neutral" size="sm" className="rounded-full">
                                    {role.users} Users
                                </Badge>
                            )
                        },
                        {
                            header: 'Global Permissions',
                            accessor: (role) => (
                                <div className="flex gap-2">
                                    {role.permissions.map((perm, idx) => (
                                        <Badge key={idx} variant="info" size="sm" className="bg-blue-50/50 text-blue-600 border-blue-100">
                                            {perm}
                                        </Badge>
                                    ))}
                                </div>
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
    );
}
