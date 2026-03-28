'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import  Table  from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Send, Clock, Trash2, ImagePlus, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Types
type NotificationType = 'informational' | 'promotional' | 'alert';
type TargetAudience = 'all' | 'premium' | 'free';

interface Notification {
    id: string;
    title: string;
    body: string;
    imageUrl?: string;
    type: NotificationType;
    targetAudience: TargetAudience;
    status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
    isScheduled: boolean;
    scheduledFor?: string;
    sentAt?: string;
    createdAt: string;
    deliveryStats?: {
        totalRecipients: number;
        sent: number;
        delivered: number;
        failed: number;
        opened?: number;
        clicked?: number;
    };
}

const AUDIENCE_LABELS: Record<string, string> = {
    all: 'Tous',
    premium: 'Premium',
    free: 'Gratuit',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Brouillon',
    scheduled: 'Programmée',
    sent: 'Envoyée',
    failed: 'Échouée',
    cancelled: 'Annulée',
};

export default function NotificationsPage() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        imageUrl: '',
        type: 'informational' as NotificationType,
        targetAudience: 'all' as TargetAudience,
        isScheduled: false,
        scheduledFor: '',
        status: 'draft'
    });

    const getToken = () => localStorage.getItem('auth_token');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = getToken();
            if (!token) { toast.error('Vous devez être connecté'); return; }

            const res = await fetch('/api/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) setNotifications(data.notifications || []);
        } catch { toast.error('Erreur lors du chargement'); }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/notifications/${deleteTargetId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) { toast.success('Notification supprimée'); fetchNotifications(); }
        } catch { toast.error('Erreur lors de la suppression'); }
        finally { setIsDeleteModalOpen(false); setDeleteTargetId(null); }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setFormData({ ...formData, imageUrl: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = getToken();
            if (!token) { toast.error('Vous devez être connecté'); return; }

            const adminId = '699357295c60598711641d13';

            const payload: any = {
                title: formData.title,
                body: formData.body,
                type: formData.type,
                targetAudience: formData.targetAudience,
                createdBy: adminId,
            };

            if (formData.imageUrl) payload.imageBase64 = formData.imageUrl;

            if (formData.isScheduled && formData.scheduledFor) {
                payload.isScheduled = true;
                payload.scheduledFor = new Date(formData.scheduledFor).toISOString();
                payload.status = 'scheduled';
            } else {
                payload.status = 'sent';
            }

            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(formData.isScheduled ? 'Notification programmée' : 'Notification envoyée');
                setFormData({
                    title: '', body: '', imageUrl: '', type: 'informational',
                    targetAudience: 'all', isScheduled: false, scheduledFor: '', status: 'draft'
                });
                fetchNotifications();
                fetchStats();
            } else {
                toast.error(data.error || 'Erreur');
            }
        } catch { toast.error('Erreur réseau'); }
        finally { setLoading(false); }
    };

    const columns = [
        { header: 'Titre', accessor: (n: Notification) => (
            <div>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                {n.imageUrl && <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><ImagePlus size={10} /> Image jointe</span>}
            </div>
        )},
        { header: 'Audience', accessor: (n: Notification) => (
            <Badge variant="neutral">{AUDIENCE_LABELS[n.targetAudience] || n.targetAudience}</Badge>
        )},
        { header: 'Type', accessor: (n: Notification) => <Badge variant="neutral">{n.type}</Badge> },
        {
            header: 'Date',
            accessor: (n: Notification) => {
                if (n.scheduledFor) return `Programmée: ${new Date(n.scheduledFor).toLocaleString('fr-FR')}`;
                if (n.sentAt) return new Date(n.sentAt).toLocaleString('fr-FR');
                return '-';
            }
        },
        {
            header: 'Statut',
            accessor: (n: Notification) => (
                <Badge variant={n.status === 'sent' ? 'success' : n.status === 'scheduled' ? 'warning' : n.status === 'failed' ? 'error' : 'neutral'}>
                    {STATUS_LABELS[n.status] || n.status}
                </Badge>
            )
        },
        {
            header: 'Actions',
            accessor: (n: Notification) => (
                <button onClick={() => handleDeleteClick(n.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 size={14} />
                </button>
            )
        },
    ];

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-xs text-gray-500 mt-1">Envoyez des notifications et gérez les alertes.</p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                        <Send size={16} /> Composer une notification
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Titre"
                            placeholder="Titre de la notification"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                        />
                        <Textarea
                            label="Message"
                            placeholder="Rédigez votre message ici..."
                            rows={4}
                            value={formData.body}
                            onChange={(e) => setFormData({...formData, body: e.target.value})}
                            required
                        />

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image (optionnel)</label>
                                {formData.imageUrl ? (
                                    <div className="relative inline-block">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full max-h-40 object-cover rounded-xl border border-gray-200" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, imageUrl: ''})}
                                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary-50/30 transition-colors">
                                        <ImagePlus size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-500">Ajouter une image</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                    </label>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Audience cible"
                                    value={formData.targetAudience}
                                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value as TargetAudience})}
                                    options={[
                                        { value: 'all', label: 'Tous les utilisateurs' },
                                        { value: 'premium', label: 'Utilisateurs Premium' },
                                        { value: 'free', label: 'Utilisateurs Gratuit' }
                                    ]}
                                />
                                <Select
                                    label="Type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value as NotificationType})}
                                    options={[
                                        { value: 'informational', label: 'Information' },
                                        { value: 'promotional', label: 'Promotion' },
                                        { value: 'alert', label: 'Alerte' }
                                    ]}
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" fullWidth size="md" className="rounded-full" disabled={loading}>
                                    {loading ? 'Envoi en cours...' : 'Envoyer la notification'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                {/* History */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Clock size={16} /> Historique récent
                    </h3>
                    <Table data={notifications} keyExtractor={(notif) => notif.id} columns={columns} />
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
                    <p className="text-gray-600">Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setDeleteTargetId(null); }} className="rounded-full">Annuler</Button>
                        <Button variant="danger" onClick={confirmDelete} className="rounded-full">Supprimer</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
