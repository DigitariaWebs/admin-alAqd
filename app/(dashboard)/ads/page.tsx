/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Megaphone, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, MousePointerClick, Image as ImageIcon } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Ad {
    _id: string;
    title: string;
    description: string;
    type: 'banner' | 'interstitial';
    placement: 'tab_bar' | 'after_swipes';
    imageUrl: string;
    targetUrl: string;
    isActive: boolean;
    swipeInterval: number;
    startDate: string | null;
    endDate: string | null;
    impressions: number;
    clicks: number;
    createdAt: string;
}

const defaultForm = {
    title: '',
    description: '',
    type: 'banner' as const,
    placement: 'tab_bar' as const,
    imageUrl: '',
    targetUrl: '',
    isActive: true,
    swipeInterval: 10,
    startDate: '',
    endDate: '',
};

export default function AdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [adsEnabled, setAdsEnabled] = useState(true);
    const [freeSwipeLimit, setFreeSwipeLimit] = useState(7);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'banner' | 'interstitial'>('all');

    const getToken = () => localStorage.getItem('auth_token');

    const fetchAds = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;

            const params = new URLSearchParams();
            if (filter !== 'all') params.set('type', filter);

            const res = await fetch(`/api/admin/ads?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAds(data.ads);
                setAdsEnabled(data.adsEnabled);
                setFreeSwipeLimit(data.freeSwipeLimit ?? 7);
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            toast.error('Erreur lors du chargement des publicités');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    const toggleGlobalAds = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch('/api/admin/ads', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adsEnabled: !adsEnabled }),
            });

            if (res.ok) {
                const data = await res.json();
                setAdsEnabled(data.adsEnabled);
                toast.success(data.adsEnabled ? 'Publicités activées' : 'Publicités désactivées');
            }
        } catch {
            toast.error('Erreur lors de la modification');
        }
    };

    const saveSwipeLimit = async (value: number) => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch('/api/admin/ads', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ freeSwipeLimit: value }),
            });

            if (res.ok) {
                const data = await res.json();
                setFreeSwipeLimit(data.freeSwipeLimit);
                toast.success(`Limite de swipes mise à jour: ${data.freeSwipeLimit}`);
            }
        } catch {
            toast.error('Erreur lors de la modification');
        }
    };

    const openCreateModal = () => {
        setEditingAd(null);
        setForm(defaultForm);
        setIsModalOpen(true);
    };

    const openEditModal = (ad: Ad) => {
        setEditingAd(ad);
        setForm({
            title: ad.title,
            description: ad.description,
            type: ad.type,
            placement: ad.placement,
            imageUrl: ad.imageUrl,
            targetUrl: ad.targetUrl,
            isActive: ad.isActive,
            swipeInterval: ad.swipeInterval,
            startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
            endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = getToken();
            if (!token) return;

            const payload = {
                ...form,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
            };

            const url = editingAd ? `/api/admin/ads/${editingAd._id}` : '/api/admin/ads';
            const method = editingAd ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success(editingAd ? 'Publicité mise à jour' : 'Publicité créée');
                setIsModalOpen(false);
                fetchAds();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur');
            }
        } catch {
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const toggleAdStatus = async (ad: Ad) => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`/api/admin/ads/${ad._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !ad.isActive }),
            });

            if (res.ok) {
                toast.success(ad.isActive ? 'Publicité désactivée' : 'Publicité activée');
                fetchAds();
            }
        } catch {
            toast.error('Erreur lors de la modification');
        }
    };

    const deleteAd = async (ad: Ad) => {
        if (!confirm('Supprimer cette publicité ?')) return;

        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`/api/admin/ads/${ad._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                toast.success('Publicité supprimée');
                fetchAds();
            }
        } catch {
            toast.error('Erreur lors de la suppression');
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestion des Publicités</h1>
                    <p className="text-xs text-gray-500 mt-1">Gérez les publicités affichées dans l&apos;application.</p>
                </div>
                <Card className="rounded-[30px] min-h-125 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-gray-500">Chargement...</p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Gestion des Publicités</h1>
                        <p className="text-xs text-gray-500 mt-1">Gérez les publicités affichées dans l&apos;application.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Global toggle */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                            <span className="text-xs font-medium text-gray-600">Publicités</span>
                            {adsEnabled ? (
                                <ToggleRight size={28} className="text-primary cursor-pointer" onClick={toggleGlobalAds} />
                            ) : (
                                <ToggleLeft size={28} className="text-gray-300 cursor-pointer" onClick={toggleGlobalAds} />
                            )}
                        </div>
                        <Button size="md" className="rounded-full" onClick={openCreateModal}>
                            <Plus size={16} className="mr-1" /> Nouvelle publicité
                        </Button>
                    </div>
                </div>

                {/* Global status banner */}
                {!adsEnabled && (
                    <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex items-center gap-3">
                        <Megaphone size={20} className="text-amber-600" />
                        <p className="text-sm text-amber-800">
                            Les publicités sont actuellement <strong>désactivées</strong> globalement. Aucune publicité ne sera affichée dans l&apos;application.
                        </p>
                    </div>
                )}

                {/* Free swipe limit control */}
                <div className="bg-white border border-gray-100 rounded-[20px] p-4 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">Pub après combien de swipes</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            L&apos;utilisateur verra une pub après ce nombre de swipes
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={freeSwipeLimit}
                            onChange={(e) => setFreeSwipeLimit(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 rounded-full border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm text-center text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button size="sm" className="rounded-full" onClick={() => saveSwipeLimit(freeSwipeLimit)}>
                            Enregistrer
                        </Button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2">
                    {(['all', 'banner', 'interstitial'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filter === f
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {f === 'all' ? 'Toutes' : f === 'banner' ? 'Bannières' : 'Interstitielles'}
                        </button>
                    ))}
                </div>

                {/* Ads grid */}
                {ads.length === 0 ? (
                    <Card className="rounded-[30px] p-12 text-center">
                        <Megaphone size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">Aucune publicité trouvée</p>
                        <Button size="md" className="rounded-full mt-4" onClick={openCreateModal}>
                            <Plus size={16} className="mr-1" /> Créer une publicité
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {ads.map((ad) => (
                            <Card key={ad._id} className="rounded-[20px] overflow-hidden border border-gray-100">
                                {/* Ad image preview */}
                                <div className="relative h-40 bg-gray-100">
                                    {ad.imageUrl ? (
                                        <img
                                            src={ad.imageUrl}
                                            alt={ad.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <ImageIcon size={32} className="text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <Badge variant={ad.isActive ? 'success' : 'error'}>
                                            {ad.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="default">
                                            {ad.type === 'banner' ? 'Bannière' : 'Interstitielle'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Ad info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{ad.title}</h3>
                                    {ad.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ad.description}</p>
                                    )}

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Eye size={12} />
                                            <span>{ad.impressions.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <MousePointerClick size={12} />
                                            <span>{ad.clicks.toLocaleString()}</span>
                                        </div>
                                        {ad.impressions > 0 && (
                                            <span className="text-xs text-gray-400">
                                                CTR: {((ad.clicks / ad.impressions) * 100).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Schedule */}
                                    {ad.startDate && (
                                        <div className="mt-2">
                                            <span className="text-[10px] text-gray-400">
                                                {formatDate(ad.startDate)} {ad.endDate ? `- ${formatDate(ad.endDate)}` : ''}
                                            </span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            {ad.isActive ? (
                                                <ToggleRight size={24} className="text-primary cursor-pointer" onClick={() => toggleAdStatus(ad)} />
                                            ) : (
                                                <ToggleLeft size={24} className="text-gray-300 cursor-pointer" onClick={() => toggleAdStatus(ad)} />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(ad)}
                                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => deleteAd(ad)}
                                                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'} maxWidth="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Titre"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                    />
                    <Input
                        label="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />

                    <Select
                        label="Type"
                        value={form.type}
                        onChange={(e) => {
                            const type = e.target.value as 'banner' | 'interstitial';
                            setForm({
                                ...form,
                                type,
                                placement: type === 'banner' ? 'tab_bar' : 'after_swipes',
                            });
                        }}
                        options={[
                            { value: 'banner', label: 'Bannière (tab bar)' },
                            { value: 'interstitial', label: 'Interstitielle (popup)' },
                        ]}
                    />

                    <Input
                        label="URL de l'image"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        required
                        placeholder="https://..."
                    />

                    {form.imageUrl && (
                        <div className="rounded-[12px] overflow-hidden border border-gray-200 h-32">
                            <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <Input
                        label="URL cible (lien au clic)"
                        value={form.targetUrl}
                        onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                        placeholder="https://..."
                    />

                    {form.type === 'interstitial' && (
                        <Input
                            label="Intervalle de swipes"
                            type="number"
                            value={form.swipeInterval}
                            onChange={(e) => setForm({ ...form, swipeInterval: parseInt(e.target.value) || 10 })}
                            min="1"
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Date de début"
                            type="date"
                            value={form.startDate}
                            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        />
                        <Input
                            label="Date de fin"
                            type="date"
                            value={form.endDate}
                            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-[16px]">
                        <span className="text-sm text-gray-700">Active</span>
                        {form.isActive ? (
                            <ToggleRight size={28} className="text-primary cursor-pointer" onClick={() => setForm({ ...form, isActive: false })} />
                        ) : (
                            <ToggleLeft size={28} className="text-gray-300 cursor-pointer" onClick={() => setForm({ ...form, isActive: true })} />
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="md" className="rounded-full" onClick={() => setIsModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" size="md" className="rounded-full" disabled={saving}>
                            {saving ? 'Enregistrement...' : editingAd ? 'Mettre à jour' : 'Créer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
