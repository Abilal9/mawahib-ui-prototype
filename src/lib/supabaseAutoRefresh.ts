import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from './supabase';

let listenerCount = 0;

function applyAutoRefresh(state: AppStateStatus | string | null | undefined): void {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
}

/**
 * React Native cannot infer focus the way a browser tab can.
 * Register once: foreground starts GoTrue auto-refresh, background stops it.
 */
export function registerSupabaseAutoRefreshLifecycle(): () => void {
  if (listenerCount > 0) {
    return () => {};
  }
  listenerCount += 1;
  applyAutoRefresh(AppState.currentState ?? 'active');
  const sub = AppState.addEventListener('change', applyAutoRefresh);
  return () => {
    sub.remove();
    listenerCount = Math.max(0, listenerCount - 1);
    void supabase.auth.stopAutoRefresh();
  };
}

export function supabaseAutoRefreshListenerCount(): number {
  return listenerCount;
}
