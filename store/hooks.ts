import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { AppDispatch, RootState } from './index';

/**
 * Typed wrapper around react-redux's useDispatch, scoped to this app's AppDispatch type.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
/**
 * Typed wrapper around react-redux's useSelector, scoped to this app's RootState type.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
