import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import ordersReducer from './orders/ordersSlice';
import inventoryReducer from './inventory/inventorySlice';
import customersReducer from './customers/customersSlice';
import analyticsReducer from './analytics/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    inventory: inventoryReducer,
    customers: customersReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
