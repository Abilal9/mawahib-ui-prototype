import { useEffect } from 'react';
import { useCreateMenu } from '../../context/CreateMenuContext';
import { useAuthGate } from '../../context/AuthGateContext';

/**
 * Guest Create tab. Sign in to create — centralized Auth Gate, no mutation.
 * Does not open authenticated create flows.
 */
export default function GuestCreateMenu() {
  const { isOpen, close } = useCreateMenu();
  const { requireAuth } = useAuthGate();

  useEffect(() => {
    if (!isOpen) return;
    close();
    requireAuth({
      action: 'create',
      route: 'GuestTabs',
      params: { screen: 'HomeTab' },
    });
  }, [close, isOpen, requireAuth]);

  return null;
}
