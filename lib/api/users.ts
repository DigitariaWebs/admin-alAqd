const API_BASE_URL = '/api';

function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AdminUser {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    gender?: string;
    dateOfBirth?: string;
    nationality?: string[];
    ethnicity?: string[];
    maritalStatus?: string;
    education?: string;
    profession?: string;
    location?: string;
    bio?: string;
    height?: number;
    religiousPractice?: string;
    faithTags?: string[];
    interests?: string[];
    personality?: string[];
    photos?: string[];
    photoBlurEnabled?: boolean;
    smoking?: string;
    children?: string;
    role: 'user' | 'moderator' | 'admin';
    status: 'active' | 'inactive' | 'suspended' | 'banned';
    subscription?: {
        plan: string;
        isActive: boolean;
        startDate?: string;
        endDate?: string;
    };
    isOnboarded: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    provider?: string;
    mahram?: {
        email?: string;
        relationship?: string;
        notifiedAt?: string;
    };
    preferences?: Record<string, unknown>;
    createdAt: string;
    updatedAt?: string;
    lastActive?: string;
    stats?: {
        matchCount: number;
        messageCount: number;
        swipeCount: number;
    };
}

export interface UserFilters {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    gender?: string;
    nationality?: string;
    minAge?: number;
    maxAge?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    subscription?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface UsersListResponse {
    success: boolean;
    users: AdminUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
        suspended: number;
        premium: number;
        male: number;
        female: number;
    };
}

export interface UserDetailResponse {
    success: boolean;
    user: AdminUser;
}

export interface RolesResponse {
    success: boolean;
    roles: Array<{
        value: string;
        label: string;
        description: string;
        permissions: string[];
    }>;
    statuses: Array<{
        value: string;
        label: string;
        description: string;
    }>;
}

export const usersApi = {
    /**
     * GET /api/admin/users
     * List users with filters
     */
    getUsers: async (filters: UserFilters = {}): Promise<UsersListResponse> => {
        const params = new URLSearchParams();
        
        if (filters.page) params.append('page', String(filters.page));
        if (filters.limit) params.append('limit', String(filters.limit));
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.nationality) params.append('nationality', filters.nationality);
        if (filters.minAge) params.append('minAge', String(filters.minAge));
        if (filters.maxAge) params.append('maxAge', String(filters.maxAge));
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.subscription) params.append('subscription', filters.subscription);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        const res = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch users');
        }

        return res.json();
    },

    /**
     * GET /api/admin/users/[id]
     * Get user details
     */
    getUser: async (id: string): Promise<UserDetailResponse> => {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch user');
        }

        return res.json();
    },

    /**
     * POST /api/admin/users
     * Create new user
     */
    createUser: async (userData: {
        name: string;
        email?: string;
        phoneNumber?: string;
        password?: string;
        gender?: string;
        dateOfBirth?: string;
        nationality?: string[];
        ethnicity?: string[];
        maritalStatus?: string;
        education?: string;
        profession?: string;
        location?: string;
        bio?: string;
        interests?: string[];
        role?: string;
        status?: string;
    }): Promise<UserDetailResponse> => {
        const res = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(userData),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to create user');
        }

        return res.json();
    },

    /**
     * PUT /api/admin/users/[id]
     * Update user
     */
    updateUser: async (id: string, userData: Partial<AdminUser>): Promise<UserDetailResponse> => {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(userData),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update user');
        }

        return res.json();
    },

    /**
     * DELETE /api/admin/users/[id]
     * Delete user
     */
    deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { ...getAuthHeaders() },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to delete user');
        }

        return res.json();
    },

    /**
     * PATCH /api/admin/users/[id]/status
     * Update user status
     */
    updateUserStatus: async (id: string, status: string): Promise<UserDetailResponse> => {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ status }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update user status');
        }

        return res.json();
    },

    /**
     * PATCH /api/admin/users/[id]/role
     * Update user role
     */
    updateUserRole: async (id: string, role: string): Promise<UserDetailResponse> => {
        const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ role }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update user role');
        }

        return res.json();
    },

    /**
     * GET /api/admin/users/export
     * Export users to CSV
     */
    exportUsers: async (filters: UserFilters = {}): Promise<void> => {
        const params = new URLSearchParams({ format: 'csv' });
        
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.nationality) params.append('nationality', filters.nationality);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.subscription) params.append('subscription', filters.subscription);

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const res = await fetch(`${API_BASE_URL}/admin/users/export?${params.toString()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to export users');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    /**
     * GET /api/admin/users/roles
     * List available roles
     */
    getRoles: async (): Promise<RolesResponse> => {
        const res = await fetch(`${API_BASE_URL}/admin/users/roles`, {
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch roles');
        }

        return res.json();
    },
};
