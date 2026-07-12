import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AccountType = 'talent' | 'business';

interface AuthContextValue {
  accountType: AccountType | null;
  setAccountType: (type: AccountType) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  return (
    <AuthContext.Provider value={{ accountType, setAccountType }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
