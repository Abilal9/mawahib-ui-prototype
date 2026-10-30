import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isAuthenticatedProductActive,
  subscribeProductTree,
} from '../lib/productTree';
import { navigateSignedOut } from '../navigation/navigationRef';
import {
  clearStagedReturnIntent,
  persistStagedReturnIntent,
  stageReturnIntent,
  type ReturnIntent,
  type ReturnIntentAction,
  type ReturnIntentParams,
  type AllowedReturnRoute,
} from '../lib/returnIntent';

export type AuthGateRequest = {
  action: ReturnIntentAction;
  route: AllowedReturnRoute;
  params?: ReturnIntentParams;
};

type AuthGateContextValue = {
  visible: boolean;
  intent: ReturnIntent | null;
  requireAuth: (request: AuthGateRequest) => void;
  chooseSignIn: () => void;
  chooseCreateAccount: () => void;
  cancel: () => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [intent, setIntent] = useState<ReturnIntent | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    return subscribeProductTree(() => {
      if (!isAuthenticatedProductActive()) return;
      setVisible(false);
      setIntent(null);
      clearStagedReturnIntent();
      busyRef.current = false;
    });
  }, []);

  const requireAuth = useCallback((request: AuthGateRequest) => {
    if (isAuthenticatedProductActive()) return;
    if (busyRef.current) return;
    const staged = stageReturnIntent(request);
    if (!staged) return;
    setIntent(staged);
    setVisible(true);
  }, []);

  const cancel = useCallback(() => {
    if (busyRef.current) return;
    setVisible(false);
    setIntent(null);
    clearStagedReturnIntent();
  }, []);

  const releaseBusy = useCallback(() => {
    setTimeout(() => {
      busyRef.current = false;
    }, 400);
  }, []);

  const chooseSignIn = useCallback(() => {
    if (busyRef.current || !intent) return;
    busyRef.current = true;
    persistStagedReturnIntent(intent);
    setVisible(false);
    navigateSignedOut('SignIn');
    releaseBusy();
  }, [intent, releaseBusy]);

  const chooseCreateAccount = useCallback(() => {
    if (busyRef.current || !intent) return;
    busyRef.current = true;
    persistStagedReturnIntent(intent);
    setVisible(false);
    navigateSignedOut('Welcome', { step: 1 });
    releaseBusy();
  }, [intent, releaseBusy]);

  const value = useMemo(
    () => ({
      visible,
      intent,
      requireAuth,
      chooseSignIn,
      chooseCreateAccount,
      cancel,
    }),
    [visible, intent, requireAuth, chooseSignIn, chooseCreateAccount, cancel],
  );

  return (
    <AuthGateContext.Provider value={value}>{children}</AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateContextValue {
  const value = useContext(AuthGateContext);
  if (!value) {
    throw new Error('useAuthGate must be used within AuthGateProvider');
  }
  return value;
}
