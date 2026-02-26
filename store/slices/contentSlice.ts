import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contentApi, categoryApi, onboardingApi, Content, Category, OnboardingContent } from '@/lib/api/content';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentState {
    items: Content[];
    categories: Category[];
    onboarding: OnboardingContent[];
    selectedContent: Content | null;
    isLoading: boolean;
    isError: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface CategoryState {
    items: Category[];
    isLoading: boolean;
    isError: boolean;
    error: string | null;
}

interface OnboardingState {
    items: OnboardingContent[];
    isLoading: boolean;
    isError: boolean;
    error: string | null;
}

interface ContentSliceState {
    content: ContentState;
    categories: CategoryState;
    onboarding: OnboardingState;
}

const initialState: ContentSliceState = {
    content: {
        items: [],
        categories: [],
        onboarding: [],
        selectedContent: null,
        isLoading: false,
        isError: false,
        error: null,
        pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        },
    },
    categories: {
        items: [],
        isLoading: false,
        isError: false,
        error: null,
    },
    onboarding: {
        items: [],
        isLoading: false,
        isError: false,
        error: null,
    },
};

// ─── Async Thunks ───────────────────────────────────────────────────────────

// Content
export const fetchContent = createAsyncThunk(
    'content/fetchContent',
    async (params: {
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        category?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}, { rejectWithValue }) => {
        try {
            const response = await contentApi.list(params);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch content');
        }
    }
);

export const fetchContentById = createAsyncThunk(
    'content/fetchContentById',
    async (id: string, { rejectWithValue }) => {
        try {
            const content = await contentApi.getById(id);
            return content;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch content');
        }
    }
);

export const createContent = createAsyncThunk(
    'content/createContent',
    async (data: Parameters<typeof contentApi.create>[0], { rejectWithValue }) => {
        try {
            const content = await contentApi.create(data);
            return content;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create content');
        }
    }
);

export const updateContent = createAsyncThunk(
    'content/updateContent',
    async ({ id, data }: { id: string; data: Parameters<typeof contentApi.update>[1] }, { rejectWithValue }) => {
        try {
            const content = await contentApi.update(id, data);
            return content;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update content');
        }
    }
);

export const deleteContent = createAsyncThunk(
    'content/deleteContent',
    async (id: string, { rejectWithValue }) => {
        try {
            await contentApi.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete content');
        }
    }
);

export const updateContentStatus = createAsyncThunk(
    'content/updateContentStatus',
    async ({ id, status }: { id: string; status: 'draft' | 'published' | 'pending' }, { rejectWithValue }) => {
        try {
            const content = await contentApi.updateStatus(id, status);
            return content;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update content status');
        }
    }
);

// Categories
export const fetchCategories = createAsyncThunk(
    'content/fetchCategories',
    async (type: string | undefined = undefined, { rejectWithValue }) => {
        try {
            const response = await categoryApi.list(type);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch categories');
        }
    }
);

export const createCategory = createAsyncThunk(
    'content/createCategory',
    async (data: Parameters<typeof categoryApi.create>[0], { rejectWithValue }) => {
        try {
            const category = await categoryApi.create(data);
            return category;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create category');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'content/updateCategory',
    async ({ id, data }: { id: string; data: Parameters<typeof categoryApi.update>[1] }, { rejectWithValue }) => {
        try {
            const category = await categoryApi.update(id, data);
            return category;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'content/deleteCategory',
    async (id: string, { rejectWithValue }) => {
        try {
            await categoryApi.delete(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete category');
        }
    }
);

// Onboarding
export const fetchOnboardingContent = createAsyncThunk(
    'content/fetchOnboardingContent',
    async (params: { type?: string; useDefault?: boolean } = {}, { rejectWithValue }) => {
        try {
            const response = await onboardingApi.get(params?.type, params?.useDefault);
            // If response.data is an array, use it directly
            if (Array.isArray(response.data)) {
                return response.data;
            }
            // If it's default config, return empty array (use config directly)
            return [];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch onboarding content');
        }
    }
);

export const updateOnboardingContent = createAsyncThunk(
    'content/updateOnboardingContent',
    async (data: Parameters<typeof onboardingApi.update>[0], { rejectWithValue }) => {
        try {
            const content = await onboardingApi.update(data);
            return content;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update onboarding content');
        }
    }
);

// ─── Slice ──────────────────────────────────────────────────────────────────

const contentSlice = createSlice({
    name: 'content',
    initialState,
    reducers: {
        clearContentError: (state) => {
            state.content.error = null;
            state.categories.error = null;
            state.onboarding.error = null;
        },
        clearSelectedContent: (state) => {
            state.content.selectedContent = null;
        },
    },
    extraReducers: (builder) => {
        // Content fetch
        builder
            .addCase(fetchContent.pending, (state) => {
                state.content.isLoading = true;
                state.content.isError = false;
                state.content.error = null;
            })
            .addCase(fetchContent.fulfilled, (state, action) => {
                state.content.isLoading = false;
                state.content.items = action.payload.data;
                state.content.pagination = action.payload.pagination;
            })
            .addCase(fetchContent.rejected, (state, action) => {
                state.content.isLoading = false;
                state.content.isError = true;
                state.content.error = action.payload as string;
            })
            // Content by ID
            .addCase(fetchContentById.pending, (state) => {
                state.content.isLoading = true;
                state.content.isError = false;
            })
            .addCase(fetchContentById.fulfilled, (state, action) => {
                state.content.isLoading = false;
                state.content.selectedContent = action.payload;
            })
            .addCase(fetchContentById.rejected, (state, action) => {
                state.content.isLoading = false;
                state.content.isError = true;
                state.content.error = action.payload as string;
            })
            // Create content
            .addCase(createContent.fulfilled, (state, action) => {
                state.content.items.unshift(action.payload);
                state.content.pagination.total += 1;
            })
            // Update content
            .addCase(updateContent.fulfilled, (state, action) => {
                const index = state.content.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.content.items[index] = action.payload;
                }
                if (state.content.selectedContent?._id === action.payload._id) {
                    state.content.selectedContent = action.payload;
                }
            })
            // Delete content
            .addCase(deleteContent.fulfilled, (state, action) => {
                state.content.items = state.content.items.filter(item => item._id !== action.payload);
                state.content.pagination.total -= 1;
            })
            // Update status
            .addCase(updateContentStatus.fulfilled, (state, action) => {
                const index = state.content.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.content.items[index] = action.payload;
                }
            })
            // Categories fetch
            .addCase(fetchCategories.pending, (state) => {
                state.categories.isLoading = true;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.categories.isLoading = false;
                state.categories.items = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.categories.isLoading = false;
                state.categories.isError = true;
                state.categories.error = action.payload as string;
            })
            // Create category
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.items.push(action.payload);
            })
            // Update category
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.categories.items[index] = action.payload;
                }
            })
            // Delete category
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories.items = state.categories.items.filter(item => item._id !== action.payload);
            })
            // Onboarding fetch
            .addCase(fetchOnboardingContent.pending, (state) => {
                state.onboarding.isLoading = true;
            })
            .addCase(fetchOnboardingContent.fulfilled, (state, action) => {
                state.onboarding.isLoading = false;
                state.onboarding.items = action.payload;
            })
            .addCase(fetchOnboardingContent.rejected, (state, action) => {
                state.onboarding.isLoading = false;
                state.onboarding.isError = true;
                state.onboarding.error = action.payload as string;
            })
            // Update onboarding
            .addCase(updateOnboardingContent.fulfilled, (state, action) => {
                const index = state.onboarding.items.findIndex(item => item.key === action.payload.key);
                if (index !== -1) {
                    state.onboarding.items[index] = action.payload;
                } else {
                    state.onboarding.items.push(action.payload);
                }
            });
    },
});

export const { clearContentError, clearSelectedContent } = contentSlice.actions;
export default contentSlice.reducer;
