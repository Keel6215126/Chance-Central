"use client";

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';

const ADMIN_STORAGE_KEY = 'chance-central-admin-mode';

interface AdminModeContextType {
  isAdminMode: boolean;
  setIsAdminMode: (isAdmin: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children, initialValue = false }: { children: ReactNode, initialValue?: boolean }) {
  // Always initialize with initialValue on both server and client for the first render
  // This ensures consistency for hydration.
  const [isAdminMode, setIsAdminModeState] = useState<boolean>(initialValue);

  // Effect to read from localStorage and update state ONLY on the client after mount
  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedValue !== null) {
        const parsedValue = JSON.parse(storedValue);
        if (typeof parsedValue === 'boolean') {
          // Update state based on localStorage only after the component has mounted on the client
          setIsAdminModeState(parsedValue);
        }
      }
    } catch (e) {
      // console.error("Error parsing admin mode from localStorage on client mount.", e);
    }
  }, []); // Empty dependency array: run once on mount after initial render

  // Effect to sync state back to localStorage and update body class whenever isAdminMode changes
  useEffect(() => {
    // This effect also runs on the client after the above effect potentially updates isAdminMode
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(isAdminMode));
      } catch (e) {
        // console.error("Failed to set admin mode in localStorage", e);
      }

      if (isAdminMode) {
        document.body.classList.add('admin-mode-active');
      } else {
        document.body.classList.remove('admin-mode-active');
      }
    }
    // Cleanup function to remove the class when the component unmounts
    // or if isAdminMode changes away from true.
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('admin-mode-active');
      }
    };
  }, [isAdminMode]); // Run when isAdminMode changes

  const setIsAdminMode = useCallback((isAdmin: boolean) => {
    setIsAdminModeState(isAdmin);
  }, []);

  return (
    <AdminModeContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export { AdminModeContext };
