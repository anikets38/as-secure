import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVault } from '@/contexts/VaultContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, Lock, Unlock, Sun, Moon, Monitor, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { session, logout, isLocalFirstMode } = useAuth();
  const { isVaultUnlocked, lockVault } = useVault();
  const { theme, setTheme } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLock = () => {
    lockVault();
    navigate('/unlock');
  };

  const handleLogout = async () => {
    lockVault();
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-vault-surface/80 backdrop-blur-md border-b border-vault-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-vault-glow transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-wider text-vault-text">
                AS <span className="brand-text-gradient">SECURE</span>
              </span>
            </div>
            <p className="text-[10px] text-vault-muted font-medium hidden sm:block">
              Your Private Document Vault
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Online/Offline Status Indicator */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Local-First Badge */}
          {isLocalFirstMode && (
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
              Local Vault Mode
            </span>
          )}

          {/* Security Status / Lock Button */}
          {isVaultUnlocked ? (
            <button
              onClick={handleLock}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
              title="Click to lock vault immediately"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vault Secure</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vault Locked</span>
            </div>
          )}

          {/* Theme Switcher */}
          <div className="flex items-center bg-vault-bg border border-vault-border rounded-lg p-0.5">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md text-xs transition ${
                theme === 'light' ? 'bg-brand-pink text-white shadow' : 'text-vault-muted hover:text-vault-text'
              }`}
              title="Light Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md text-xs transition ${
                theme === 'dark' ? 'bg-brand-pink text-white shadow' : 'text-vault-muted hover:text-vault-text'
              }`}
              title="Dark Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-1.5 rounded-md text-xs transition ${
                theme === 'system' ? 'bg-brand-pink text-white shadow' : 'text-vault-muted hover:text-vault-text'
              }`}
              title="Follow OS Theme"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logout Button */}
          {session.isAuthenticated && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-vault-muted hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
