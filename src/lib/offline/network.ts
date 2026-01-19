/**
 * Network Status
 * Online/offline detection with event handling
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface NetworkState {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
  lastOnlineAt: string | null;
  lastOfflineAt: string | null;
}

export interface NetworkStore extends NetworkState {
  setNetworkState: (state: Partial<NetworkState>) => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true, // Optimistic default
  isConnected: null,
  connectionType: null,
  lastOnlineAt: null,
  lastOfflineAt: null,

  setNetworkState: (state) => set(state),
}));

// =============================================================================
// NETWORK MONITORING
// =============================================================================

let unsubscribe: (() => void) | null = null;
const listeners: Set<(isOnline: boolean) => void> = new Set();

/**
 * Start monitoring network status
 */
export function startNetworkMonitoring(): void {
  if (unsubscribe) return; // Already monitoring

  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = state.isConnected === true && state.isInternetReachable !== false;
    const wasOnline = useNetworkStore.getState().isOnline;

    const now = new Date().toISOString();

    useNetworkStore.getState().setNetworkState({
      isOnline,
      isConnected: state.isConnected,
      connectionType: state.type,
      ...(isOnline && !wasOnline ? { lastOnlineAt: now } : {}),
      ...(!isOnline && wasOnline ? { lastOfflineAt: now } : {}),
    });

    // Notify listeners
    if (isOnline !== wasOnline) {
      console.log('[Network]', isOnline ? 'Online' : 'Offline');
      for (const listener of listeners) {
        try {
          listener(isOnline);
        } catch (error) {
          console.error('[Network] Listener error:', error);
        }
      }
    }
  });

  console.log('[Network] Monitoring started');
}

/**
 * Stop monitoring network status
 */
export function stopNetworkMonitoring(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('[Network] Monitoring stopped');
  }
}

/**
 * Subscribe to online/offline events
 */
export function onNetworkChange(
  callback: (isOnline: boolean) => void
): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Check current network status
 */
export async function checkNetworkStatus(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    const isOnline = state.isConnected === true && state.isInternetReachable !== false;
    return isOnline;
  } catch {
    return false;
  }
}

/**
 * Get current online status from store (synchronous)
 */
export function isOnline(): boolean {
  return useNetworkStore.getState().isOnline;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to get network status
 */
export function useNetworkStatus() {
  const isOnline = useNetworkStore(s => s.isOnline);
  const isConnected = useNetworkStore(s => s.isConnected);
  const connectionType = useNetworkStore(s => s.connectionType);

  return {
    isOnline,
    isConnected,
    connectionType,
  };
}
