'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createContent, fetchCategories } from '@/store/slices/contentSlice';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, UploadCloud, Loader2 } from 'lucide-react';

export default function CreateContentPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { items: categories, isLoading: isCategoriesLoading } = useAppSelector(state => state.content.categories);
    
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        type: 'article' as const,
        content: '',
        excerpt: '',
        featuredImage: '',
        author: 'Admin',
        category: '',
        status: 'draft',
        seoTitle: '',
        seoDescription: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Auto-generate slug from title
            ...(name === 'title' && !prev.slug ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
        }));
    };

    const handleSubmit = async (status: 'draft' | 'published') => {
        setIsSubmitting(true);
        try {
            await dispatch(createContent({
                ...formData,
                status,
                slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            })).unwrap();
            
            router.push('/content');
        } catch (error) {
            console.error('Failed to create content:', error);
            setErrorMessage('Échec de la création du contenu. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categoryOptions = [
        { value: '', label: 'Sélectionner une catégorie' },
        ...categories.map((cat: any) => ({ value: cat._id, label: cat.name }))
    ];

    if (isCategoriesLoading && categories.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center justify-between">
                    {errorMessage}
                    <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/content" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Créer un nouveau contenu</h1>
                        <p className="text-xs text-gray-500">Remplissez les détails ci-dessous pour créer un nouveau contenu.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/content">
                        <Button variant="outline" size="md" className="rounded-full">Annuler</Button>
                    </Link>
                    <Button 
                        size="md" 
                        className="gap-2 rounded-full"
                        onClick={() => handleSubmit('draft')}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        <span>Enregistrer le brouillon</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <Card className="lg:col-span-2 space-y-6 rounded-[30px] p-8">
                    <Input
                        label="Titre du contenu"
                        name="title"
                        placeholder="Entrez un titre descriptif"
                        value={formData.title}
                        onChange={handleChange}
                        className="text-lg font-medium"
                    />

                    <Input
                        label="Slug"
                        name="slug"
                        placeholder="slug-du-contenu"
                        value={formData.slug}
                        onChange={handleChange}
                        helperText="Version du titre adaptée aux URL"
                    />

                    <Textarea
                        label="Corps du contenu"
                        name="content"
                        placeholder="Rédigez votre contenu ici..."
                        rows={12}
                        value={formData.content}
                        onChange={handleChange}
                        className="font-normal"
                    />

                    <Textarea
                        label="Extrait"
                        name="excerpt"
                        placeholder="Bref résumé du contenu..."
                        rows={3}
                        value={formData.excerpt}
                        onChange={handleChange}
                    />
                </Card>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    <Card className="rounded-[30px] p-6 space-y-4">
                        <h3 className="font-semibold text-sm mb-2">Publication</h3>

                        <Select
                            label="Type de contenu"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={[
                                { value: 'article', label: 'Article' },
                                { value: 'video', label: 'Vidéo' },
                                { value: 'post', label: 'Publication' },
                                { value: 'page', label: 'Page' },
                            ]}
                        />

                        <Select
                            label="Statut"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            options={[
                                { value: 'draft', label: 'Brouillon' },
                                { value: 'published', label: 'Publié' },
                                { value: 'pending', label: 'En attente de révision' },
                            ]}
                        />

                        <Select
                            label="Catégorie"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            options={categoryOptions}
                        />

                        <Input
                            label="Auteur"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                        />

                        <div className="pt-4 mt-4 border-t border-gray-50">
                            <Button 
                                fullWidth 
                                size="md" 
                                className="rounded-full"
                                onClick={() => handleSubmit('published')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Publier maintenant
                            </Button>
                        </div>
                    </Card>

                    <Card className="rounded-[30px] p-6 space-y-4">
                        <h3 className="font-semibold text-sm mb-4">Référencement (SEO)</h3>

                        <Input
                            label="Titre SEO"
                            name="seoTitle"
                            placeholder="Titre optimisé pour le référencement"
                            value={formData.seoTitle}
                            onChange={handleChange}
                        />

                        <Textarea
                            label="Description SEO"
                            name="seoDescription"
                            placeholder="Méta-description..."
                            rows={3}
                            value={formData.seoDescription}
                            onChange={handleChange}
                        />
                    </Card>

                    <Card className="rounded-[30px] p-6">
                        <h3 className="font-semibold text-sm mb-4">Image mise en avant</h3>
                        <div 
                            className="border-2 border-dashed border-gray-200 rounded-[20px] h-32 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:bg-primary-50 hover:text-primary transition-all cursor-pointer relative"
                            onClick={() => document.getElementById('featured-image-input')?.click()}
                        >
                            <input 
                                type="file" 
                                id="featured-image-input"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    // Create FormData and upload
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('type', 'image');
                                    formData.append('folder', 'al-aqd/content');
                                    
                                    // Get auth token
                                    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
                                    
                                    try {
                                        const response = await fetch('/api/admin/upload', {
                                            method: 'POST',
                                            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                                            body: formData,
                                        });
                                        
                                        const data = await response.json();
                                        if (data.success) {
                                            setFormData(prev => ({ ...prev, featuredImage: data.url }));
                                        } else {
                                            console.error('Upload failed:', data.error);
                                            setErrorMessage(data.error || 'Échec du téléchargement de l\'image');
                                        }
                                    } catch (err) {
                                        console.error('Upload error:', err);
                                        setErrorMessage('Échec du téléchargement de l\'image');
                                    }
                                }}
                            />
                            <UploadCloud size={24} className="mb-2" />
                            <span className="text-xs">Cliquez pour télécharger</span>
                        </div>
                        {formData.featuredImage && (
                            <div className="mt-2 relative">
                                <img src={formData.featuredImage} alt="Featured" className="w-full h-32 object-cover rounded-lg" />
                                <button 
                                    type="button"
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
