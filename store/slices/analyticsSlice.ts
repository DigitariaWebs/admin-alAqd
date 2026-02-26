import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsApi } from '@/lib/api/analytics';

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

interface DailyGrowth {
    date: string;
    users: number;
    revenue: number;
}

interface RevenueData {
    period: string;
    revenue: number;
    subscriptions: number;
}

interface Activity {
    id: string;
    type: string;
    description: string;
    user?: { id: string; name: string };
    timestamp: string;
    metadata?: Record<string, unknown>;
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

interface AnalyticsState {
    // Dashboard
    dashboard: {
        overview: DashboardStats | null;
        dailyGrowth: DailyGrowth[];
        period: string;
    };
    
    // Revenue
    revenue: {
        data: RevenueData[];
        summary: {
            totalRevenue: number;
            averageRevenue: number;
            totalSubscriptions: number;
            growthPercentage: number;
        } | null;
        revenueByPlan: Array<{ plan: string; count: number; revenue: number }>;
        period: string;
    };
    
    // Activities
    activities: {
        items: Activity[];
        summary: {
            today: {
                newUsers: number;
                newMatches: number;
                newMessages: number;
            };
            total: number;
        } | null;
    };
    
    // Insights
    insights: Insight[];
    
    // Report
    report: {
        data: Record<string, unknown> | null;
        type: string;
        isGenerating: boolean;
    };
    
    // UI State
    isLoading: boolean;
    error: string | null;
    selectedPeriod: string;
}

const initialState: AnalyticsState = {
    dashboard: {
        overview: null,
        dailyGrowth: [],
        period: '30d'
    },
    revenue: {
        data: [],
        summary: null,
        revenueByPlan: [],
        period: 'monthly'
    },
    activities: {
        items: [],
        summary: null
    },
    insights: [],
    report: {
        data: null,
        type: 'summary',
        isGenerating: false
    },
    isLoading: false,
    error: null,
    selectedPeriod: '30d'
};

// Async thunks
export const fetchDashboard = createAsyncThunk(
    'analytics/fetchDashboard',
    async (period: string = '30d', { rejectWithValue }) => {
        try {
            const response = await analyticsApi.getDashboard(period);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchRevenue = createAsyncThunk(
    'analytics/fetchRevenue',
    async ({ period = 'monthly', months = 12 }: { period?: string; months?: number } = {}, { rejectWithValue }) => {
        try {
            const response = await analyticsApi.getRevenue(period, months);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchActivities = createAsyncThunk(
    'analytics/fetchActivities',
    async ({ limit = 20, type = 'all' }: { limit?: number; type?: string } = {}, { rejectWithValue }) => {
        try {
            const response = await analyticsApi.getActivities(limit, type);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchInsights = createAsyncThunk(
    'analytics/fetchInsights',
    async (_, { rejectWithValue }) => {
        try {
            const response = await analyticsApi.getInsights();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const generateReport = createAsyncThunk(
    'analytics/generateReport',
    async (
        { type = 'summary', format = 'json', startDate, endDate }: {
            type?: string;
            format?: string;
            startDate?: string;
            endDate?: string;
        } = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await analyticsApi.getReport(type, format, startDate, endDate);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        setSelectedPeriod: (state, action: PayloadAction<string>) => {
            state.selectedPeriod = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearReport: (state) => {
            state.report.data = null;
            state.report.type = 'summary';
        }
    },
    extraReducers: (builder) => {
        // Dashboard
        builder.addCase(fetchDashboard.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchDashboard.fulfilled, (state, action) => {
            state.isLoading = false;
            state.dashboard.overview = action.payload.overview;
            state.dashboard.dailyGrowth = action.payload.dailyGrowth;
            state.dashboard.period = action.payload.period;
        });
        builder.addCase(fetchDashboard.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Revenue
        builder.addCase(fetchRevenue.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchRevenue.fulfilled, (state, action) => {
            state.isLoading = false;
            state.revenue.data = action.payload.revenueData;
            state.revenue.summary = action.payload.summary;
            state.revenue.revenueByPlan = action.payload.revenueByPlan;
            state.revenue.period = action.payload.period;
        });
        builder.addCase(fetchRevenue.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Activities
        builder.addCase(fetchActivities.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchActivities.fulfilled, (state, action) => {
            state.isLoading = false;
            state.activities.items = action.payload.activities;
            state.activities.summary = action.payload.summary;
        });
        builder.addCase(fetchActivities.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Insights
        builder.addCase(fetchInsights.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchInsights.fulfilled, (state, action) => {
            state.isLoading = false;
            state.insights = action.payload.insights;
        });
        builder.addCase(fetchInsights.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Report
        builder.addCase(generateReport.pending, (state) => {
            state.report.isGenerating = true;
            state.error = null;
        });
        builder.addCase(generateReport.fulfilled, (state, action) => {
            state.report.isGenerating = false;
            state.report.data = action.payload.report.data;
            state.report.type = action.payload.report.type;
        });
        builder.addCase(generateReport.rejected, (state, action) => {
            state.report.isGenerating = false;
            state.error = action.payload as string;
        });
    }
});

export const { setSelectedPeriod, clearError, clearReport } = analyticsSlice.actions;
export default analyticsSlice.reducer;
