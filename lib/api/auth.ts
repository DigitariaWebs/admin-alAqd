const API_BASE_URL = '/api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface PhoneLoginData {
    phoneNumber: string;
}

export interface VerifyOTPData {
    phoneNumber: string;
    otp: string;
}

export interface GoogleLoginData {
    idToken: string;
}

export interface AppleLoginData {
    identityToken: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export interface RefreshTokenData {
    refreshToken: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    refreshToken?: string;
    user?: any;
}

export interface ApiError {
    error: string;
}

export const authApi = {
    // Admin login
    login: async (credentials: LoginCredentials) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }
        
        return response.json();
    },

    // Admin/User logout
    logout: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Logout failed');
        }
        
        return response.json();
    },

    // Password recovery
    forgotPassword: async (data: ForgotPasswordData) => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Password recovery failed');
        }
        
        return response.json();
    },

    // Reset password with token
    resetPassword: async (data: ResetPasswordData) => {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Password reset failed');
        }
        
        return response.json();
    },

    // Get current user
    getCurrentUser: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get user');
        }
        
        return response.json();
    },

    // Phone login (send OTP)
    phoneLogin: async (data: PhoneLoginData) => {
        const response = await fetch(`${API_BASE_URL}/auth/phone-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Phone login failed');
        }
        
        return response.json();
    },

    // Verify OTP
    verifyOTP: async (data: VerifyOTPData) => {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'OTP verification failed');
        }
        
        return response.json();
    },

    // Google OAuth
    googleLogin: async (data: GoogleLoginData) => {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Google login failed');
        }
        
        return response.json();
    },

    // Apple OAuth
    appleLogin: async (data: AppleLoginData) => {
        const response = await fetch(`${API_BASE_URL}/auth/apple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Apple login failed');
        }
        
        return response.json();
    },

    // Refresh JWT token
    refreshToken: async (data: RefreshTokenData) => {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Token refresh failed');
        }
        
        return response.json();
    },
};
