const API_BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export type LegalDocumentType = 'privacy' | 'terms';
export type LegalDocumentLanguage = 'en' | 'fr' | 'ar' | 'es';

export interface LegalDocument {
    id: string;
    type: LegalDocumentType;
    language: LegalDocumentLanguage;
    title: string;
    content: string;
    version: number;
    updatedAt: string;
    updatedBy?: string;
}

export const legalApi = {
    async list(): Promise<LegalDocument[]> {
        const res = await fetch(`${API_BASE_URL}/admin/legal`, {
            headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load legal documents');
        const data = await res.json();
        return data.documents;
    },

    async get(
        type: LegalDocumentType,
        language: LegalDocumentLanguage,
    ): Promise<LegalDocument | null> {
        const res = await fetch(`${API_BASE_URL}/admin/legal/${type}/${language}`, {
            headers: getAuthHeaders(),
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to load legal document');
        const data = await res.json();
        return data.document;
    },

    async update(
        type: LegalDocumentType,
        language: LegalDocumentLanguage,
        payload: { title: string; content: string },
    ): Promise<LegalDocument> {
        const res = await fetch(`${API_BASE_URL}/admin/legal/${type}/${language}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to save legal document');
        }
        const data = await res.json();
        return data.document;
    },
};
