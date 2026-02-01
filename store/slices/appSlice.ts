import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
    sidebarOpen: boolean;
    theme: 'light' | 'dark'; // Although user said only light mode, keeping structure
    isLoading: boolean;
}

const initialState: AppState = {
    sidebarOpen: true,
    theme: 'light',
    isLoading: false,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        toggleSidebar(state) {
            state.sidebarOpen = !state.sidebarOpen;
        },
        setSidebarOpen(state, action: PayloadAction<boolean>) {
            state.sidebarOpen = action.payload;
        },
        setTheme(state, action: PayloadAction<'light' | 'dark'>) {
            state.theme = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload;
        },
    },
});

export const { toggleSidebar, setSidebarOpen, setTheme, setLoading } = appSlice.actions;
export default appSlice.reducer;
