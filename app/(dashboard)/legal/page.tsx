'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
    legalApi,
    type LegalDocument,
    type LegalDocumentLanguage,
    type LegalDocumentType,
} from '@/lib/api/legal';

const TYPES: { value: LegalDocumentType; label: string; icon: React.ReactNode }[] = [
    { value: 'privacy', label: 'Politique de confidentialité', icon: <ShieldCheck size={16} /> },
    { value: 'terms', label: "Conditions d'utilisation", icon: <FileText size={16} /> },
];

const LANGUAGES: { value: LegalDocumentLanguage; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ar', label: 'العربية', flag: '🇸🇦' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
];

export default function LegalDocumentsPage() {
    const [activeType, setActiveType] = useState<LegalDocumentType>('privacy');
    const [activeLanguage, setActiveLanguage] = useState<LegalDocumentLanguage>('fr');

    const [document, setDocument] = useState<LegalDocument | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const loadDocument = useCallback(async () => {
        setIsLoading(true);
        try {
            const doc = await legalApi.get(activeType, activeLanguage);
            setDocument(doc);
            setTitle(doc?.title ?? '');
            setContent(doc?.content ?? '');
            setIsDirty(false);
        } catch (err: any) {
            toast.error(err.message || 'Erreur de chargement');
        } finally {
            setIsLoading(false);
        }
    }, [activeType, activeLanguage]);

    useEffect(() => {
        loadDocument();
    }, [loadDocument]);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Le titre et le contenu sont obligatoires');
            return;
        }
        setIsSaving(true);
        try {
            const updated = await legalApi.update(activeType, activeLanguage, {
                title: title.trim(),
                content,
            });
            setDocument(updated);
            setIsDirty(false);
            toast.success(`Enregistré (version ${updated.version})`);
        } catch (err: any) {
            toast.error(err.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents légaux</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gérez la politique de confidentialité et les conditions d&apos;utilisation
                    affichées dans l&apos;application mobile.
                </p>
            </div>

            {/* Type tabs */}
            <div className="flex gap-2 border-b border-gray-100">
                {TYPES.map((t) => {
                    const isActive = activeType === t.value;
                    return (
                        <button
                            key={t.value}
                            onClick={() => setActiveType(t.value)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                isActive
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Language selector + version info */}
            <div className="flex flex-wrap items-center gap-3">
                {LANGUAGES.map((l) => {
                    const isActive = activeLanguage === l.value;
                    return (
                        <button
                            key={l.value}
                            onClick={() => setActiveLanguage(l.value)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                isActive
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <span>{l.flag}</span>
                            {l.label}
                        </button>
                    );
                })}

                <div className="flex-1" />

                {document && (
                    <div className="text-xs text-gray-500">
                        Version {document.version} · Modifié le{' '}
                        {new Date(document.updatedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </div>
                )}
            </div>

            {/* Editor */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    {!document && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
                            Aucun document existant pour cette combinaison. Remplissez les champs et
                            cliquez sur Enregistrer pour créer un nouveau document.
                        </div>
                    )}

                    <Input
                        label="Titre"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            setIsDirty(true);
                        }}
                        placeholder="Ex: Politique de confidentialité"
                    />

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">
                            Contenu
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value);
                                setIsDirty(true);
                            }}
                            placeholder="Saisissez le texte du document. Utilisez les sauts de ligne pour les paragraphes."
                            rows={28}
                            className="block w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                            dir={activeLanguage === 'ar' ? 'rtl' : 'ltr'}
                        />
                        <p className="mt-2 text-xs text-gray-400 ml-1">
                            Astuce : utilisez des titres en MAJUSCULES et des lignes vides pour
                            séparer les paragraphes. Le contenu sera affiché tel quel dans
                            l&apos;application mobile.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                        {isDirty && (
                            <span className="text-xs text-amber-600">Modifications non enregistrées</span>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            variant="primary"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin mr-2" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Save size={14} className="mr-2" />
                                    Enregistrer
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
