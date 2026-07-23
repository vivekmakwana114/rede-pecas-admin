'use client';

import { Provider } from 'react-redux';
import { store } from './index';

/**
 * Wraps the app tree with react-redux's Provider so any descendant
 * component can access the configured Redux store.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
