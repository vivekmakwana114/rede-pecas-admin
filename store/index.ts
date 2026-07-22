import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import ordersReducer from './orders/ordersSlice';
import inventoryReducer from './inventory/inventorySlice';
import servicesReducer from './services/servicesSlice';
import customersReducer from './customers/customersSlice';
import analyticsReducer from './analytics/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    inventory: inventoryReducer,
    services: servicesReducer,
    customers: customersReducer,
    analytics: analyticsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
