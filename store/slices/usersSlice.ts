import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { usersApi, AdminUser, UserFilters, RolesResponse } from '@/lib/api/users';

interface UsersState {
    list: {
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
        filters: UserFilters;
    };
    selectedUser: AdminUser | null;
    roles: {
        roles: Array<{ value: string; label: string; description: string; permissions: string[] }>;
        statuses: Array<{ value: string; label: string; description: string }>;
    };
    isLoading: boolean;
    isLoadingDetail: boolean;
    isCreating: boolean;
    error: string | null;
}

const initialState: UsersState = {
    list: {
        users: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        stats: { total: 0, active: 0, inactive: 0, suspended: 0, premium: 0, male: 0, female: 0 },
        filters: { page: 1, limit: 20 },
    },
    selectedUser: null,
    roles: { roles: [], statuses: [] },
    isLoading: false,
    isLoadingDetail: false,
    isCreating: false,
    error: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (filters: UserFilters = {}, { rejectWithValue }) => {
        try {
            const response = await usersApi.getUsers(filters);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchUserDetail = createAsyncThunk(
    'users/fetchUserDetail',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await usersApi.getUser(id);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const createUser = createAsyncThunk(
    'users/createUser',
    async (userData: Parameters<typeof usersApi.createUser>[0], { rejectWithValue }) => {
        try {
            const response = await usersApi.createUser(userData);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateUser = createAsyncThunk(
    'users/updateUser',
    async ({ id, userData }: { id: string; userData: Partial<AdminUser> }, { rejectWithValue }) => {
        try {
            const response = await usersApi.updateUser(id, userData);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteUser = createAsyncThunk(
    'users/deleteUser',
    async (id: string, { rejectWithValue }) => {
        try {
            await usersApi.deleteUser(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateUserStatus = createAsyncThunk(
    'users/updateUserStatus',
    async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
        try {
            const response = await usersApi.updateUserStatus(id, status);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateUserRole = createAsyncThunk(
    'users/updateUserRole',
    async ({ id, role }: { id: string; role: string }, { rejectWithValue }) => {
        try {
            const response = await usersApi.updateUserRole(id, role);
            return response.user;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchRoles = createAsyncThunk(
    'users/fetchRoles',
    async (_, { rejectWithValue }) => {
        try {
            const response = await usersApi.getRoles();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<UserFilters>) => {
            state.list.filters = { ...state.list.filters, ...action.payload };
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.list.filters.page = action.payload;
        },
        clearSelectedUser: (state) => {
            state.selectedUser = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch Users
        builder.addCase(fetchUsers.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchUsers.fulfilled, (state, action) => {
            state.isLoading = false;
            state.list.users = action.payload.users;
            state.list.pagination = action.payload.pagination;
            state.list.stats = action.payload.stats;
        });
        builder.addCase(fetchUsers.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        });

        // Fetch User Detail
        builder.addCase(fetchUserDetail.pending, (state) => {
            state.isLoadingDetail = true;
            state.error = null;
        });
        builder.addCase(fetchUserDetail.fulfilled, (state, action) => {
            state.isLoadingDetail = false;
            state.selectedUser = action.payload;
        });
        builder.addCase(fetchUserDetail.rejected, (state, action) => {
            state.isLoadingDetail = false;
            state.error = action.payload as string;
        });

        // Create User
        builder.addCase(createUser.pending, (state) => {
            state.isCreating = true;
            state.error = null;
        });
        builder.addCase(createUser.fulfilled, (state, action) => {
            state.isCreating = false;
            state.list.users.unshift(action.payload);
            state.list.pagination.total += 1;
        });
        builder.addCase(createUser.rejected, (state, action) => {
            state.isCreating = false;
            state.error = action.payload as string;
        });

        // Update User
        builder.addCase(updateUser.fulfilled, (state, action) => {
            const index = state.list.users.findIndex(u => u.id === action.payload.id);
            if (index !== -1) {
                state.list.users[index] = action.payload;
            }
            if (state.selectedUser?.id === action.payload.id) {
                state.selectedUser = action.payload;
            }
        });

        // Delete User
        builder.addCase(deleteUser.fulfilled, (state, action) => {
            state.list.users = state.list.users.filter(u => u.id !== action.payload);
            state.list.pagination.total -= 1;
        });
        builder.addCase(deleteUser.rejected, (state, action) => {
            state.error = action.payload as string;
        });

        // Update User Status
        builder.addCase(updateUserStatus.fulfilled, (state, action) => {
            const index = state.list.users.findIndex(u => u.id === action.payload.id);
            if (index !== -1) {
                state.list.users[index].status = action.payload.status;
            }
            if (state.selectedUser?.id === action.payload.id) {
                state.selectedUser.status = action.payload.status;
            }
        });
        builder.addCase(updateUserStatus.rejected, (state, action) => {
            state.error = action.payload as string;
        });

        // Update User Role
        builder.addCase(updateUserRole.fulfilled, (state, action) => {
            const index = state.list.users.findIndex(u => u.id === action.payload.id);
            if (index !== -1) {
                state.list.users[index].role = action.payload.role;
            }
            if (state.selectedUser?.id === action.payload.id) {
                state.selectedUser.role = action.payload.role;
            }
        });
        builder.addCase(updateUserRole.rejected, (state, action) => {
            state.error = action.payload as string;
        });

        // Fetch Roles
        builder.addCase(fetchRoles.fulfilled, (state, action) => {
            state.roles = action.payload;
        });
    },
});

export const { setFilters, setPage, clearSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;
