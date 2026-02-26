const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Content {
    _id: string;
    title: string;
    slug: string;
    type: 'article' | 'video' | 'post' | 'page';
    content: string;
    excerpt?: string;
    featuredImage?: string;
    author: string;
    category?: string;
    tags?: string[];
    status: 'draft' | 'published' | 'pending';
    publishedAt?: string;
    seoTitle?: string;
    seoDescription?: string;
    order?: number;
    viewCount: number;
    createdAt: string;
    updatedAt?: string;
}

export interface ContentListParams {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ContentListResponse {
    data: Content[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateContentPayload {
    title: string;
    slug: string;
    type: 'article' | 'video' | 'post' | 'page';
    content: string;
    excerpt?: string;
    featuredImage?: string;
    author: string;
    category?: string;
    tags?: string[];
    status?: 'draft' | 'published' | 'pending';
    seoTitle?: string;
    seoDescription?: string;
    order?: number;
}

export interface UpdateContentPayload extends Partial<CreateContentPayload> {}

// ─── Content API ────────────────────────────────────────────────────────────

export const contentApi = {
    /**
     * List all content (articles, videos, posts, pages)
     */
    async list(params: ContentListParams = {}): Promise<ContentListResponse> {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.set('page', params.page.toString());
        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.type) queryParams.set('type', params.type);
        if (params.status) queryParams.set('status', params.status);
        if (params.category) queryParams.set('category', params.category);
        if (params.search) queryParams.set('search', params.search);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        const response = await fetch(`${API_BASE_URL}/admin/content?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch content');
        }

        return response.json();
    },

    /**
     * Get content by ID
     */
    async getById(id: string): Promise<Content> {
        const response = await fetch(`${API_BASE_URL}/admin/content/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch content');
        }

        return response.json();
    },

    /**
     * Create new content
     */
    async create(data: CreateContentPayload): Promise<Content> {
        const response = await fetch(`${API_BASE_URL}/admin/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create content');
        }

        return response.json();
    },

    /**
     * Update content
     */
    async update(id: string, data: UpdateContentPayload): Promise<Content> {
        const response = await fetch(`${API_BASE_URL}/admin/content/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update content');
        }

        return response.json();
    },

    /**
     * Delete content
     */
    async delete(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/admin/content/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete content');
        }

        return response.json();
    },

    /**
     * Update content status
     */
    async updateStatus(id: string, status: 'draft' | 'published' | 'pending'): Promise<Content> {
        const response = await fetch(`${API_BASE_URL}/admin/content/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update content status');
        }

        return response.json();
    },
};

// ─── Category Types ─────────────────────────────────────────────────────────

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    type: 'article' | 'video' | 'post' | 'page' | 'all';
    parentId?: string;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

// ─── Category API ───────────────────────────────────────────────────────────

export const categoryApi = {
    /**
     * List all categories
     */
    async list(type?: string): Promise<{ data: Category[] }> {
        const queryParams = type ? `?type=${type}` : '';
        
        const response = await fetch(`${API_BASE_URL}/admin/categories${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch categories');
        }

        return response.json();
    },

    /**
     * Create category
     */
    async create(data: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
        const response = await fetch(`${API_BASE_URL}/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create category');
        }

        return response.json();
    },

    /**
     * Update category
     */
    async update(id: string, data: Partial<Category>): Promise<Category> {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update category');
        }

        return response.json();
    },

    /**
     * Delete category
     */
    async delete(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete category');
        }

        return response.json();
    },
};

// ─── Onboarding Types ───────────────────────────────────────────────────────

export interface OnboardingItem {
    value: string;
    label: string;
    category?: string;
}

export interface OnboardingContent {
    _id: string;
    section: string;
    key: string;
    type: 'personality' | 'faith' | 'interests' | 'guidelines' | 'tips';
    items: OnboardingItem[];
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt?: string;
}

// ─── Onboarding API ─────────────────────────────────────────────────────────

export const onboardingApi = {
    /**
     * Get onboarding content
     */
    async get(type?: string, useDefault?: boolean): Promise<{ data: OnboardingContent[] | Record<string, unknown>; isDefault?: boolean }> {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (useDefault) params.set('useDefault', 'true');
        
        const queryString = params.toString();
        
        const response = await fetch(`${API_BASE_URL}/admin/onboarding${queryString ? `?${queryString}` : ''}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch onboarding content');
        }

        return response.json();
    },

    /**
     * Update onboarding content
     */
    async update(data: Partial<OnboardingContent> & { key: string; type: OnboardingContent['type'] }): Promise<OnboardingContent> {
        const response = await fetch(`${API_BASE_URL}/admin/onboarding`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update onboarding content');
        }

        return response.json();
    },

    /**
     * Seed onboarding content from config
     */
    async seed(): Promise<{ message: string; data: OnboardingContent[] }> {
        const response = await fetch(`${API_BASE_URL}/admin/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to seed onboarding content');
        }

        return response.json();
    },
};
