'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { MessageSquare, User, AlertCircle, Send, Clock, Filter, Loader2, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Ticket {
    id: string;
    ticketNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    category: string;
    messages: Array<{
        id: string;
        sender: string;
        content: string;
        timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface Stats {
    overview: {
        totalTickets: number;
        ticketsCreatedToday: number;
        ticketsClosedToday: number;
    };
    statusBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    avgResponseTimeHours: number;
}

interface Log {
    id: string;
    level: string;
    message: string;
    category: string;
    user: string;
    ip: string;
    createdAt: string;
}

export default function SupportPage() {
    const [activeTab, setActiveTab] = useState('tickets');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Filters
    const [ticketStatus, setTicketStatus] = useState('');
    const [ticketPriority, setTicketPriority] = useState('');
    const [logLevel, setLogLevel] = useState('');
    const [logCategory, setLogCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const getToken = () => localStorage.getItem('auth_token');

    useEffect(() => {
        fetchTickets();
        fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, logLevel, logCategory]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const params = new URLSearchParams();
            if (ticketStatus) params.set('status', ticketStatus);
            if (ticketPriority) params.set('priority', ticketPriority);
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/support/tickets?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await res.json();
            if (data.success) {
                setTickets(data.tickets);
            }
        } catch (error) {
            toast.error('Erreur lors du chargement des tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch('/api/admin/support/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = getToken();
            if (!token) return;

            const params = new URLSearchParams();
            if (logLevel) params.set('level', logLevel);
            if (logCategory) params.set('category', logCategory);

            const res = await fetch(`/api/admin/support/logs?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (id: string) => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`/api/admin/support/tickets/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (data.success) {
                setSelectedTicket(data.ticket);
                setShowReplyModal(true);
            }
        } catch (error) {
            toast.error('Erreur lors du chargement du ticket');
        }
    };

    const handleReply = async () => {
        if (!selectedTicket || !replyContent.trim()) return;

        try {
            setSendingReply(true);
            const token = getToken();
            if (!token) {
                toast.error('Vous devez être connecté');
                return;
            }

            const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: replyContent })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Réponse envoyée avec succès');
                setReplyContent('');
                fetchTicketDetails(selectedTicket.id);
                fetchTickets();
                fetchStats();
            } else {
                toast.error(data.error || 'Erreur lors de l\'envoi');
            }
        } catch (error) {
            toast.error('Erreur lors de l\'envoi');
        } finally {
            setSendingReply(false);
        }
    };

    const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Statut mis à jour');
                fetchTickets();
                fetchStats();
                if (selectedTicket?.id === ticketId) {
                    fetchTicketDetails(ticketId);
                }
            }
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleExportLogs = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const params = new URLSearchParams();
            if (logLevel) params.set('level', logLevel);
            if (logCategory) params.set('category', logCategory);
            params.set('format', 'csv');

            const response = await fetch(`/api/admin/support/logs/export?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Logs exportés avec succès');
        } catch (error) {
            toast.error('Erreur lors de l\'export');
        }
    };

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'neutral';
            default: return 'neutral';
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'open': return 'error';
            case 'pending': return 'warning';
            case 'closed': return 'success';
            default: return 'neutral';
        }
    };

    const getLogLevelVariant = (level: string) => {
        switch (level) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            case 'info': return 'info';
            case 'debug': return 'neutral';
            default: return 'neutral';
        }
    };

    const ticketColumns = [
        { header: 'ID', accessor: (t: Ticket) => t.ticketNumber },
        { header: 'Utilisateur', accessor: (t: Ticket) => t.userName },
        { header: 'Sujet', accessor: (t: Ticket) => t.subject },
        {
            header: 'Priorité',
            accessor: (t: Ticket) => (
                <Badge variant={getPriorityVariant(t.priority) as any}>
                    {t.priority}
                </Badge>
            )
        },
        { 
            header: 'Statut',
            accessor: (t: Ticket) => (
                <Badge variant={getStatusVariant(t.status) as any}>
                    {t.status}
                </Badge>
            )
        },
        { 
            header: 'Date', 
            accessor: (t: Ticket) => new Date(t.createdAt).toLocaleDateString() 
        },
        {
            header: 'Action',
            accessor: (t: Ticket) => (
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-primary hover:text-primary-600"
                    onClick={() => fetchTicketDetails(t.id)}
                >
                    Voir
                </Button>
            )
        },
    ];

    const logColumns = [
        { 
            header: 'Heure',
            accessor: (l: Log) => new Date(l.createdAt).toLocaleString() 
        },
        { 
            header: 'Niveau',
            accessor: (l: Log) => (
                <Badge variant={getLogLevelVariant(l.level) as any}>
                    {l.level}
                </Badge>
            )
        },
        { header: 'Catégorie', accessor: (l: Log) => l.category },
        { header: 'Message', accessor: (l: Log) => l.message },
        { header: 'Utilisateur', accessor: (l: Log) => l.user || '-' },
        { header: 'IP', accessor: (l: Log) => l.ip || '-' },
    ];

    return (
        <>
            <Toaster position="top-right" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Support & Journaux</h1>
                        <p className="text-xs text-gray-500 mt-1">Gérez les tickets de support et les journaux système.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card className="rounded-[30px] p-0 overflow-hidden min-h-100">
                            <div className="p-6 pb-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 text-sm">
                                        {activeTab === 'tickets' ? 'Tickets de support' : 'Journaux système'}
                                    </h3>
                                    <div className="flex gap-2">
                                        {activeTab === 'tickets' ? (
                                            <>
                                                <Select
                                                    value={ticketStatus}
                                                    onChange={(e) => setTicketStatus(e.target.value)}
                                                    options={[
                                                        { value: '', label: 'Tous les statuts' },
                                                        { value: 'open', label: 'Ouvert' },
                                                        { value: 'pending', label: 'En attente' },
                                                        { value: 'closed', label: 'Fermé' },
                                                    ]}
                                                    className="w-32"
                                                />
                                                <Select
                                                    value={ticketPriority}
                                                    onChange={(e) => setTicketPriority(e.target.value)}
                                                    options={[
                                                        { value: '', label: 'Toutes les priorités' },
                                                        { value: 'high', label: 'Haute' },
                                                        { value: 'medium', label: 'Moyenne' },
                                                        { value: 'low', label: 'Basse' },
                                                    ]}
                                                    className="w-32"
                                                />
                                                <Button variant="outline" size="sm" onClick={fetchTickets}>
                                                    <Filter size={14} />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Select
                                                    value={logLevel}
                                                    onChange={(e) => setLogLevel(e.target.value)}
                                                    options={[
                                                        { value: '', label: 'Tous les niveaux' },
                                                        { value: 'info', label: 'Info' },
                                                        { value: 'warning', label: 'Avertissement' },
                                                        { value: 'error', label: 'Erreur' },
                                                        { value: 'debug', label: 'Debug' },
                                                    ]}
                                                    className="w-32"
                                                />
                                                <Button variant="outline" size="sm" onClick={handleExportLogs}>
                                                    Exporter
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <Button 
                                        variant={activeTab === 'tickets' ? 'primary' : 'outline'} 
                                        size="sm"
                                        onClick={() => setActiveTab('tickets')}
                                    >
                                        Tickets
                                    </Button>
                                    <Button
                                        variant={activeTab === 'logs' ? 'primary' : 'outline'}
                                        size="sm"
                                        onClick={() => setActiveTab('logs')}
                                    >
                                        Journaux
                                    </Button>
                                </div>
                            </div>
                            
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : activeTab === 'tickets' ? (
                                <Table
                                    data={tickets}
                                    keyExtractor={(t) => t.id}
                                    columns={ticketColumns}
                                />
                            ) : (
                                <Table
                                    data={logs}
                                    keyExtractor={(l) => l.id}
                                    columns={logColumns}
                                />
                            )}
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[30px] p-6 bg-primary text-white shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <MessageSquare size={20} />
                                </div>
                                <h3 className="font-bold">Statistiques support</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-xs opacity-80">Tickets ouverts</span>
                                    <span className="font-bold text-lg">{stats?.statusBreakdown?.open || 0}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-xs opacity-80">Temps moyen</span>
                                    <span className="font-bold text-lg">{stats?.avgResponseTimeHours || 0}h</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs opacity-80">Fermés aujourd&apos;hui</span>
                                    <span className="font-bold text-lg">{stats?.overview?.ticketsClosedToday || 0}</span>
                                </div>
                            </div>
                        </div>

                        <Card className="rounded-[30px] p-6">
                            <h3 className="font-bold text-gray-900 text-sm mb-4 flex gap-2"><AlertCircle size={16} /> Activité récente</h3>
                            <div className="space-y-3">
                                {tickets.slice(0, 3).map((ticket) => (
                                    <div key={ticket.id} className="text-xs border-l-2 border-gray-200 pl-3 py-1">
                                        <p className="text-gray-900 font-medium">{ticket.subject}</p>
                                        <p className="text-gray-400 text-[10px]">{new Date(ticket.createdAt).toLocaleString()}</p>
                                    </div>
                                ))}
                                {tickets.length === 0 && (
                                    <p className="text-xs text-gray-400">Aucun ticket récent</p>
                                )}
                            </div>
                            <Button fullWidth variant="ghost" className="mt-2 text-xs" onClick={() => setActiveTab('tickets')}>
                                Voir tous les tickets
                            </Button>
                        </Card>
                    </div>
                </div>

                {/* Reply Modal */}
                <Modal
                    isOpen={showReplyModal}
                    onClose={() => {
                        setShowReplyModal(false);
                        setSelectedTicket(null);
                        setReplyContent('');
                    }}
                    title={`Ticket #${selectedTicket?.ticketNumber || ''}`}
                >
                    {selectedTicket && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-[20px] p-4">
                                <h4 className="font-semibold text-sm">{selectedTicket.subject}</h4>
                                <p className="text-xs text-gray-500 mt-1">{selectedTicket.description}</p>
                                <div className="flex gap-2 mt-2">
                                    <Badge variant={getPriorityVariant(selectedTicket.priority) as any}>
                                        {selectedTicket.priority}
                                    </Badge>
                                    <Badge variant={getStatusVariant(selectedTicket.status) as any}>
                                        {selectedTicket.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-3">
                                {selectedTicket.messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`p-3 rounded-[20px] ${msg.sender === 'admin' ? 'bg-primary/10 ml-8' : 'bg-gray-50 mr-8'}`}
                                    >
                                        <p className="text-xs font-semibold text-gray-500 mb-1">
                                            {msg.sender === 'admin' ? 'Admin' : selectedTicket.userName}
                                        </p>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(msg.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <Textarea
                                label="Réponse"
                                placeholder="Tapez votre réponse..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                rows={3}
                            />

                            <div className="flex gap-2">
                                <Select
                                    value={selectedTicket.status}
                                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                                    options={[
                                        { value: 'open', label: 'Ouvert' },
                                        { value: 'pending', label: 'En attente' },
                                        { value: 'closed', label: 'Fermé' },
                                    ]}
                                    className="w-40"
                                />
                                <Button 
                                    onClick={handleReply} 
                                    disabled={sendingReply || !replyContent.trim()}
                                    className="flex-1"
                                >
                                    {sendingReply ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} className="mr-2" />
                                            Envoyer
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </>
    );
}
