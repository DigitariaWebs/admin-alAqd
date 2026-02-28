const API_BASE_URL = '/api';

export interface UserProfile {
    id: string;
    phoneNumber?: string;
    email?: string;
    name: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
    profession?: string;
    location?: string;
    height?: number;
    nationality: string[];
    ethnicity: string[];
    maritalStatus?: string;
    education?: string;
    religiousPractice?: string;
    faithTags: string[];
    drinking?: string;
    smoking?: string;
    interests: string[];
    personality: string[];
    photos: string[];
    role: string;
    status: string;
    isOnboarded: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    subscription?: {
        plan: string;
        isActive: boolean;
        startDate?: string;
        endDate?: string;
    };
    lastActive?: string;
    createdAt: string;
}

export interface UpdateProfileData {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    profession?: string;
    education?: string;
    nationality?: string[];
    location?: string;
    ethnicity?: string[];
    height?: number;
    maritalStatus?: string;
    religiousPractice?: string;
    faithTags?: string[];
    drinking?: string;
    smoking?: string;
    interests?: string[];
    personality?: string[];
    photos?: string[];
    bio?: string;
    isOnboarded?: boolean;
}

export interface ProfileCompletion {
    percentage: number;
    incomplete: { key: string; label: string; weight: number }[];
}

export const userApi = {
    // Get own full profile
    getMyProfile: async (token: string): Promise<{ success: boolean; user: UserProfile }> => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get profile');
        }
        return response.json();
    },

    // Get user profile by ID (admin use)
    getUserById: async (token: string, id: string): Promise<{ success: boolean; user: UserProfile }> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get user');
        }
        return response.json();
    },

    // Update own profile
    updateProfile: async (token: string, data: UpdateProfileData): Promise<{ success: boolean; user: UserProfile }> => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
        }
        return response.json();
    },

    // Add photos
    addPhotos: async (token: string, uris: string[]): Promise<{ success: boolean; photos: string[] }> => {
        const response = await fetch(`${API_BASE_URL}/users/me/photos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ uris }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add photos');
        }
        return response.json();
    },

    // Delete photo by index
    deletePhoto: async (token: string, index: number): Promise<{ success: boolean; photos: string[] }> => {
        const response = await fetch(`${API_BASE_URL}/users/me/photos?index=${index}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete photo');
        }
        return response.json();
    },

    // Set primary photo by index
    setPrimaryPhoto: async (token: string, index: number): Promise<{ success: boolean; photos: string[] }> => {
        const response = await fetch(`${API_BASE_URL}/users/me/photos/primary`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ index }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to set primary photo');
        }
        return response.json();
    },

    // Get profile completion percentage
    getProfileCompletion: async (token: string): Promise<{ success: boolean; completion: ProfileCompletion }> => {
        const response = await fetch(`${API_BASE_URL}/users/me/completion`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get completion');
        }
        return response.json();
    },

    // Delete own account
    deleteAccount: async (token: string): Promise<{ success: boolean; message: string }> => {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete account');
        }
        return response.json();
    },
};
