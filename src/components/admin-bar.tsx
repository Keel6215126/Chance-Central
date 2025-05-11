"use client";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useAdminMode } from '@/hooks/useAdminMode'; 

const ADMIN_PASSWORD = "keel6215"; 

export function AdminBar() {
  const [passwordInput, setPasswordInput] = useState('');
  const [isAdminMode, setIsAdminMode] = useAdminMode(); 
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const handleLoginAttempt = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdminMode(true);
      setPasswordInput(''); 
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
      setPasswordInput(''); 
      setTimeout(() => setShowPasswordError(false), 2000);
    }
  };

  const handleLogout = () => {
    setIsAdminMode(false);
  };
  
  // If not mounted yet, render the bar with a placeholder for the admin section
  if (!isClientMounted) {
    return (
      <div className="fixed top-0 left-0 right-0 h-[45px] bg-[var(--admin-bar-bg)] border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-end space-x-4 z-50">
        <ThemeSwitcher />
        <div className="h-7 w-[170px]" /> {/* Placeholder for admin login/logout section */}
      </div>
    );
  }

  // Client is mounted, render the actual admin section
  return (
    <div className="fixed top-0 left-0 right-0 h-[45px] bg-[var(--admin-bar-bg)] border-b border-[var(--border-color)] px-4 py-2 flex items-center justify-end space-x-4 z-50">
      <ThemeSwitcher />
      {isAdminMode ? (
        <Button id="adminLogoutBtn" onClick={handleLogout} variant="destructive" size="sm" className="h-7 text-xs">
          Logout Admin
        </Button>
      ) : (
        <div className="flex items-center space-x-2">
          <Input
            type="password"
            id="adminPasswordInput"
            aria-label="Admin Password"
            placeholder="Admin Login"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLoginAttempt();
              }
            }}
            className={`h-7 text-xs w-28 ${showPasswordError ? 'border-destructive ring-destructive ring-1' : ''}`}
          />
          <Button onClick={handleLoginAttempt} size="sm" variant="outline" className="h-7 text-xs">
            Login
          </Button>
        </div>
      )}
    </div>
  );
}
