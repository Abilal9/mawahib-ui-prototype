import { useCallback, useState } from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import {
  MARKETPLACE_SUCCESS,
  MarketplaceSuccessKey,
  resetToJobs,
} from '../utils/marketplaceSuccess';

interface SuccessState {
  key: MarketplaceSuccessKey;
  title: string;
  message: string;
}

/**
 * Shows a success confirmation, then returns to the correct Jobs inbox view.
 * Call only after the backend operation has already succeeded (and refreshed).
 */
export function useMarketplaceSuccess(
  navigation: NavigationProp<ParamListBase>,
  refresh?: () => Promise<void>,
) {
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const showSuccess = useCallback((key: MarketplaceSuccessKey) => {
    const copy = MARKETPLACE_SUCCESS[key];
    setSuccess({ key, title: copy.title, message: copy.message });
  }, []);

  const completeSuccess = useCallback(async () => {
    if (!success) return;
    const landing = MARKETPLACE_SUCCESS[success.key].landing;
    setSuccess(null);
    if (refresh) {
      try {
        await refresh();
      } catch {
        // Navigation still proceeds; Jobs focus effect will retry.
      }
    }
    resetToJobs(navigation, landing);
  }, [navigation, refresh, success]);

  return {
    successVisible: Boolean(success),
    successTitle: success?.title ?? '',
    successMessage: success?.message ?? '',
    showSuccess,
    completeSuccess,
  };
}
