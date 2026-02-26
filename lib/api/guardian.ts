const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminGuardian {
    _id: string;
    femaleUserId: string;
    maleUserId?: string;
    guardianName: string;
    guardianPhone: string;
    accessCode: string;
    status: 'pending' | 'active' | 'revoked';
    requestedAt: string;
    linkedAt?: string;
    revokedAt?: string;
    createdAt: string;
    updatedAt: string;
    femaleUser?: {
        id: string;
        name: string;
        photos: string[];
        gender: string;
    };
    maleUser?: {
        id: string;
        name: string;
        photos: string[];
        gender: string;
    };
}

export interface AdminGuardianStats {
    total: number;
    pending: number;
    active: number;
    revoked: number;
}

export interface AdminGuardianListResponse {
    success: boolean;
    guardians: AdminGuardian[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    stats: AdminGuardianStats;
}

export interface UpdateGuardianData {
    status?: 'pending' | 'active' | 'revoked';
    guardianName?: string;
    guardianPhone?: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────

export const adminGuardianApi = {
    // List all guardian relationships with filters
    list: async (
        token: string,
        options?: {
            page?: number;
            limit?: number;
            status?: string;
            search?: string;
            startDate?: string;
            endDate?: string;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<AdminGuardianListResponse> => {
        const params = new URLSearchParams();
        
        if (options?.page) params.set('page', options.page.toString());
        if (options?.limit) params.set('limit', options.limit.toString());
        if (options?.status) params.set('status', options.status);
        if (options?.search) params.set('search', options.search);
        if (options?.startDate) params.set('startDate', options.startDate);
        if (options?.endDate) params.set('endDate', options.endDate);
        if (options?.sortBy) params.set('sortBy', options.sortBy);
        if (options?.sortOrder) params.set('sortOrder', options.sortOrder);

        const response = await fetch(`${API_BASE_URL}/admin/guardians?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch guardians');
        }

        return result;
    },

    // Get guardian details
    getById: async (token: string, id: string) => {
        const response = await fetch(`${API_BASE_URL}/admin/guardians/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch guardian details');
        }

        return result;
    },

    // Update guardian status
    update: async (token: string, id: string, data: UpdateGuardianData) => {
        const response = await fetch(`${API_BASE_URL}/admin/guardians/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to update guardian');
        }

        return result;
    },

    // Delete guardian relationship
    delete: async (token: string, id: string) => {
        const response = await fetch(`${API_BASE_URL}/admin/guardians/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete guardian');
        }

        return result;
    },

    // Export guardians
    export: async (
        token: string,
        options?: {
            status?: string;
            startDate?: string;
            endDate?: string;
            format?: 'csv' | 'json';
        }
    ): Promise<Blob> => {
        const params = new URLSearchParams();
        
        if (options?.status) params.set('status', options.status);
        if (options?.startDate) params.set('startDate', options.startDate);
        if (options?.endDate) params.set('endDate', options.endDate);
        if (options?.format) params.set('format', options.format);

        const response = await fetch(`${API_BASE_URL}/admin/guardians/export?${params}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to export guardians');
        }

        return response.blob();
    },
};
