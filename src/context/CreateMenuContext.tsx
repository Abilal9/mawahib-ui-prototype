import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreateMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CreateMenuContext = createContext<CreateMenuContextValue | undefined>(undefined);

export function CreateMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CreateMenuContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((v) => !v),
      }}
    >
      {children}
    </CreateMenuContext.Provider>
  );
}

export function useCreateMenu() {
  const ctx = useContext(CreateMenuContext);
  if (!ctx) throw new Error('useCreateMenu must be used within CreateMenuProvider');
  return ctx;
}
