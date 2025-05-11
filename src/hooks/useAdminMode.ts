
"use client";

import { useContext } from 'react';
import { AdminModeContext } from '@/context/admin-mode-context';

export function useAdminMode(): [boolean, (isAdmin: boolean) => void] {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider. Make sure your layout component is wrapped with <AdminModeProvider>.');
  }
  return [context.isAdminMode, context.setIsAdminMode];
}
