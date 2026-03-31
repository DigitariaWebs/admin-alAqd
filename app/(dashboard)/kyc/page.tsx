'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, ShieldX, Clock, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Verification {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        gender: string;
        photos: string[];
        kycStatus: string;
    };
    selfieUrl: string;
    idCardFrontUrl: string;
    idCardBackUrl: string;
    faceMatch: boolean | null;
    faceScore: number | null;
    faceDetectedInSelfie: boolean | null;
    faceDetectedInId: boolean | null;
    nameMatch: boolean | null;
    dobMatch: boolean | null;
    extractedText: string;
    status: string;
    rejectionReason: string;
    reviewedBy: { name: string } | null;
    reviewedAt: string | null;
    createdAt: string;
}

interface Stats {
    pending: number;
    manual_review: number;
    verified: number;
    rejected: number;
}

export default function KycPage() {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [stats, setStats] = useState<Stats>({ pending: 0, manual_review: 0, verified: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'manual_review' | 'pending' | 'verified' | 'rejected'>('all');
    const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [acting, setActing] = useState(false);

    const getToken = () => localStorage.getItem('auth_token');

    const fetchVerifications = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;

            const params = new URLSearchParams();
            if (filter !== 'all') params.set('status', filter);

            const res = await fetch(`/api/admin/kyc?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setVerifications(data.verifications);
                setStats(data.stats);
            }
        } catch {
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const handleAction = async (action: 'verify' | 'reject') => {
        if (!selectedVerification) return;
        setActing(true);

        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`/api/admin/kyc/${selectedVerification._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    rejectionReason: action === 'reject' ? rejectionReason : '',
                }),
            });

            if (res.ok) {
                toast.success(action === 'verify' ? 'Utilisateur verifie' : 'Verification rejetee');
                setSelectedVerification(null);
                setRejectionReason('');
                fetchVerifications();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erreur');
            }
        } catch {
            toast.error('Erreur');
        } finally {
            setActing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <Badge variant="success">Verifie</Badge>;
            case 'rejected':
                return <Badge variant="error">Rejete</Badge>;
            case 'manual_review':
                return <Badge variant="warning">A examiner</Badge>;
            case 'pending':
            case 'processing':
                return <Badge variant="default">En attente</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Verification KYC</h1>
                    <p className="text-xs text-gray-500 mt-1">Gerez les verifications d&apos;identite des utilisateurs.</p>
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
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Verification KYC</h1>
                    <p className="text-xs text-gray-500 mt-1">Gerez les verifications d&apos;identite des utilisateurs.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                    <Card className="rounded-[20px] p-4 text-center">
                        <AlertTriangle size={20} className="text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.manual_review}</p>
                        <p className="text-xs text-gray-500">A examiner</p>
                    </Card>
                    <Card className="rounded-[20px] p-4 text-center">
                        <Clock size={20} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                        <p className="text-xs text-gray-500">En attente</p>
                    </Card>
                    <Card className="rounded-[20px] p-4 text-center">
                        <ShieldCheck size={20} className="text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
                        <p className="text-xs text-gray-500">Verifies</p>
                    </Card>
                    <Card className="rounded-[20px] p-4 text-center">
                        <ShieldX size={20} className="text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                        <p className="text-xs text-gray-500">Rejetes</p>
                    </Card>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2">
                    {([
                        { key: 'all', label: 'Tous' },
                        { key: 'manual_review', label: 'A examiner' },
                        { key: 'pending', label: 'En attente' },
                        { key: 'verified', label: 'Verifies' },
                        { key: 'rejected', label: 'Rejetes' },
                    ] as const).map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                filter === f.key
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Verifications list */}
                {verifications.length === 0 ? (
                    <Card className="rounded-[30px] p-12 text-center">
                        <ShieldCheck size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">Aucune verification trouvee</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {verifications.map((v) => (
                            <Card key={v._id} className="rounded-[20px] p-4 border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Selfie thumbnail */}
                                        <img
                                            src={v.selfieUrl}
                                            alt="Selfie"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {v.userId?.name || 'Utilisateur inconnu'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {v.userId?.email} &middot; {v.userId?.gender === 'male' ? 'Homme' : 'Femme'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {formatDate(v.createdAt)}
                                                {v.faceScore !== null && (
                                                    <span className="ml-2">
                                                        Score: <strong>{(v.faceScore * 100).toFixed(0)}%</strong>
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(v.status)}
                                        <button
                                            onClick={() => {
                                                setSelectedVerification(v);
                                                setRejectionReason('');
                                            }}
                                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            <Modal
                isOpen={!!selectedVerification}
                onClose={() => setSelectedVerification(null)}
                title="Verification d'identite"
                maxWidth="3xl"
            >
                {selectedVerification && (
                    <div className="space-y-6">
                        {/* User info */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{selectedVerification.userId?.name}</p>
                                <p className="text-xs text-gray-500">{selectedVerification.userId?.email}</p>
                            </div>
                            <div className="ml-auto">{getStatusBadge(selectedVerification.status)}</div>
                        </div>

                        {/* Photos */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">Selfie</p>
                                <img
                                    src={selectedVerification.selfieUrl}
                                    alt="Selfie"
                                    className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">Carte (recto)</p>
                                <img
                                    src={selectedVerification.idCardFrontUrl}
                                    alt="ID Front"
                                    className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-600 mb-2">Carte (verso)</p>
                                <img
                                    src={selectedVerification.idCardBackUrl}
                                    alt="ID Back"
                                    className="w-full h-48 object-cover rounded-2xl border border-gray-200"
                                />
                            </div>
                        </div>

                        {/* AI Results */}
                        <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                            <p className="text-xs font-semibold text-gray-700">Resultat de l&apos;analyse</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    {selectedVerification.faceDetectedInSelfie ? (
                                        <CheckCircle size={14} className="text-green-500" />
                                    ) : (
                                        <XCircle size={14} className="text-red-500" />
                                    )}
                                    <span>Visage detecte (selfie)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedVerification.faceDetectedInId ? (
                                        <CheckCircle size={14} className="text-green-500" />
                                    ) : (
                                        <XCircle size={14} className="text-red-500" />
                                    )}
                                    <span>Visage detecte (carte)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedVerification.faceMatch ? (
                                        <CheckCircle size={14} className="text-green-500" />
                                    ) : (
                                        <XCircle size={14} className="text-red-500" />
                                    )}
                                    <span>Visages correspondent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                        Score: {selectedVerification.faceScore !== null ? `${(selectedVerification.faceScore * 100).toFixed(0)}%` : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedVerification.nameMatch === true ? (
                                        <CheckCircle size={14} className="text-green-500" />
                                    ) : selectedVerification.nameMatch === false ? (
                                        <XCircle size={14} className="text-red-500" />
                                    ) : (
                                        <AlertTriangle size={14} className="text-amber-500" />
                                    )}
                                    <span>
                                        Nom {selectedVerification.nameMatch === true ? 'correspond' : selectedVerification.nameMatch === false ? 'ne correspond pas' : 'non verifie'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedVerification.dobMatch === true ? (
                                        <CheckCircle size={14} className="text-green-500" />
                                    ) : selectedVerification.dobMatch === false ? (
                                        <XCircle size={14} className="text-red-500" />
                                    ) : (
                                        <AlertTriangle size={14} className="text-amber-500" />
                                    )}
                                    <span>
                                        Date de naissance {selectedVerification.dobMatch === true ? 'correspond' : selectedVerification.dobMatch === false ? 'ne correspond pas' : 'non verifiee'}
                                    </span>
                                </div>
                            </div>
                            {selectedVerification.extractedText && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-600">Texte extrait de la carte:</p>
                                    <p className="text-xs text-gray-500 mt-1 bg-white p-2 rounded-lg">{selectedVerification.extractedText}</p>
                                </div>
                            )}
                            {selectedVerification.rejectionReason && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Raison: {selectedVerification.rejectionReason}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        {(selectedVerification.status === 'manual_review' || selectedVerification.status === 'pending' || selectedVerification.status === 'processing') && (
                            <div className="space-y-3 pt-2">
                                <Input
                                    label="Raison du rejet (optionnel)"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Ex: Photo floue, carte ilisible..."
                                />
                                <div className="flex gap-3">
                                    <Button
                                        size="md"
                                        className="rounded-full flex-1"
                                        onClick={() => handleAction('verify')}
                                        disabled={acting}
                                    >
                                        <CheckCircle size={16} className="mr-1" />
                                        {acting ? 'Traitement...' : 'Approuver'}
                                    </Button>
                                    <Button
                                        size="md"
                                        variant="outline"
                                        className="rounded-full flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleAction('reject')}
                                        disabled={acting}
                                    >
                                        <XCircle size={16} className="mr-1" />
                                        {acting ? 'Traitement...' : 'Rejeter'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Already reviewed info */}
                        {selectedVerification.reviewedBy && (
                            <p className="text-xs text-gray-400 text-center">
                                Examine par {selectedVerification.reviewedBy.name} le {selectedVerification.reviewedAt ? formatDate(selectedVerification.reviewedAt) : ''}
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
