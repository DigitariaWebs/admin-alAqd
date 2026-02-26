import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import analyticsReducer from "./slices/analyticsSlice";
import usersReducer from "./slices/usersSlice";

export const makeStore = () => {
    return configureStore({
      reducer: {
        app: appReducer,
        auth: authReducer,
        analytics: analyticsReducer,
        users: usersReducer,
      },
      devTools: process.env.NODE_ENV !== "production",
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
