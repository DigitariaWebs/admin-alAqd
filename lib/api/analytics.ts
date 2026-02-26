const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface DashboardStats {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    premiumUsers: number;
    freeUsers: number;
    totalMatches: number;
    newMatches: number;
    totalMessages: number;
    newMessages: number;
    totalSwipes: number;
    newSwipes: number;
    revenue: number;
    engagementRate: number;
    genderDistribution: {
        male: number;
        female: number;
    };
    growth: {
        users: number;
        revenue: number;
    };
}

interface DashboardResponse {
    success: boolean;
    overview: DashboardStats;
    dailyGrowth: Array<{ date: string; users: number; revenue: number }>;
    period: string;
}

interface RevenueData {
    period: string;
    revenue: number;
    subscriptions: number;
}

interface RevenueResponse {
    success: boolean;
    revenueData: RevenueData[];
    summary: {
        totalRevenue: number;
        averageRevenue: number;
        totalSubscriptions: number;
        growthPercentage: number;
    };
    revenueByPlan: Array<{ plan: string; count: number; revenue: number }>;
    period: string;
}

interface Activity {
    id: string;
    type: string;
    description: string;
    user?: { id: string; name: string };
    timestamp: string;
    metadata?: Record<string, unknown>;
}

interface ActivitiesResponse {
    success: boolean;
    activities: Activity[];
    summary: {
        today: {
            newUsers: number;
            newMatches: number;
            newMessages: number;
        };
        total: number;
    };
    limit: number;
    type: string;
}

interface GrowthData {
    period: string;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    maleUsers: number;
    femaleUsers: number;
}

interface UserGrowthResponse {
    success: boolean;
    growthData: GrowthData[];
    summary: {
        currentTotal: number;
        currentActive: number;
        totalGrowth: number;
        activeGrowth: number;
        averageNewUsers: number;
        projectedUsers: number;
    };
    period: string;
}

interface EngagementResponse {
    success: boolean;
    overview: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        monthlyActiveUsers: number;
        totalUsers: number;
        engagementRate: number;
        stickiness: number;
        avgMessagesPerUser: number;
        avgSwipesPerUser: number;
        matchRate: number;
        likesCount: number;
        messagesCount: number;
        matchesCount: number;
    };
    conversionFunnel: {
        totalUsers: number;
        withPhotos: number;
        withBio: number;
        onboarded: number;
        photoRate: number;
        bioRate: number;
        onboardingRate: number;
    };
    dailyEngagement: Array<{
        date: string;
        activeUsers: number;
        messages: number;
        swipes: number;
        matches: number;
    }>;
    engagementBySegment: Array<{
        segment: string;
        users: number;
        activeUsers: number;
        engagementRate: number;
    }>;
    topActiveUsers: Array<{
        id: string;
        name: string;
        email: string;
        lastActive: string;
    }>;
    period: string;
}

interface ReportResponse {
    success: boolean;
    report: {
        type: string;
        generatedAt: string;
        dateRange: {
            start: string;
            end: string;
        };
        data: Record<string, unknown>;
    };
}

interface Insight {
    id: string;
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    description: string;
    metric?: string;
    value?: string;
    recommendation?: string;
    detectedAt: string;
    priority: 'high' | 'medium' | 'low';
}

interface InsightsResponse {
    success: boolean;
    insights: Insight[];
    generatedAt: string;
}

const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyticsApi = {
    /**
     * GET /api/analytics
     * Dashboard overview with key metrics
     */
    getDashboard: async (period: string = '30d'): Promise<DashboardResponse> => {
        const res = await fetch(`${API_BASE_URL}/analytics?period=${period}`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch dashboard data');
        }
        
        return res.json();
    },

    /**
     * GET /api/analytics/revenue
     * Revenue data for charts
     */
    getRevenue: async (period: string = 'monthly', months: number = 12): Promise<RevenueResponse> => {
        const res = await fetch(`${API_BASE_URL}/analytics/revenue?period=${period}&months=${months}`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch revenue data');
        }
        
        return res.json();
    },

    /**
     * GET /api/analytics/activities
     * Latest system activities
     */
    getActivities: async (limit: number = 20, type: string = 'all'): Promise<ActivitiesResponse> => {
        const res = await fetch(`${API_BASE_URL}/analytics/activities?limit=${limit}&type=${type}`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch activities');
        }
        
        return res.json();
    },

    /**
     * GET /api/analytics/user-growth
     * User growth over time
     */
    getUserGrowth: async (period: string = 'monthly', months: number = 12): Promise<UserGrowthResponse> => {
        const res = await fetch(`${API_BASE_URL}/analytics/user-growth?period=${period}&months=${months}`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch user growth data');
        }
        
        return res.json();
    },

    /**
     * GET /api/analytics/engagement
     * User engagement metrics
     */
    getEngagement: async (period: string = '30d'): Promise<EngagementResponse> => {
        const res = await fetch(`${API_BASE_URL}/analytics/engagement?period=${period}`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch engagement data');
        }
        
        return res.json();
    },

    /**
     * GET /api/analytics/reports
     * Generate custom reports
     */
    getReport: async (
        type: string = 'summary',
        format: string = 'json',
        startDate?: string,
        endDate?: string
    ): Promise<ReportResponse> => {
        const params = new URLSearchParams({ type, format });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const res = await fetch(`${API_BASE_URL}/analytics/reports?${params.toString()}`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to generate report');
        }
        
        return res.json();
    },

    /**
     * GET /api/analytics/insights
     * AI-generated insights
     */
    getInsights: async (): Promise<InsightsResponse> => {
        const res = await fetch(`${API_BASE_URL}/analytics/insights`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to fetch insights');
        }
        
        return res.json();
    }
};
