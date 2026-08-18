import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/lib/db/db';
import { Settings as SettingsIcon, Lock, Moon, Sun, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { autoLockMinutes, setAutoLockMinutes, lockVault } = useVault();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [savedMsg, setSavedMsg] = useState(false);

  const handleAutoLockChange = async (mins: number) => {
    await setAutoLockMinutes(mins);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleClearLocalCache = async () => {
    if (window.confirm('Clear all locally cached encrypted document files from IndexedDB? (Cloud backups will remain intact)')) {
      await db.cachedFiles.clear();
      alert('Local cached document binaries cleared.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
          Vault <span className="brand-text-gradient">Settings</span>
        </h1>
        <p className="text-xs text-vault-muted mt-0.5">
          Configure security timers, theme preferences, and local cache management.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* Security Auto-Lock Timer */}
      <div className="p-6 rounded-2xl bg-vault-surface border border-vault-border space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-vault-text">Vault Auto-Lock Timer</h2>
            <p className="text-[11px] text-vault-muted">Automatically purges Web Crypto keys from memory when idle.</p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          {[
            { label: 'Never', value: 0 },
            { label: '5 Minutes', value: 5 },
            { label: '15 Minutes', value: 15 },
            { label: '30 Minutes', value: 30 },
            { label: '1 Hour', value: 60 }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleAutoLockChange(opt.value)}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border transition ${
                autoLockMinutes === opt.value
                  ? 'bg-brand-pink text-white border-brand-pink shadow'
                  : 'bg-vault-bg border-vault-border text-vault-subtext hover:border-brand-pink/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Setting */}
      <div className="p-6 rounded-2xl bg-vault-surface border border-vault-border space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-coral/10 flex items-center justify-center text-brand-coral">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-vault-text">Theme Preference</h2>
            <p className="text-[11px] text-vault-muted">Switch between Dark Navy Vault, Light, or System preference.</p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          {[
            { label: 'Dark Navy', value: 'dark' },
            { label: 'Light', value: 'light' },
            { label: 'Follow OS System', value: 'system' }
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value as any)}
              className={`py-2 px-4 rounded-xl text-xs font-semibold border transition ${
                theme === t.value
                  ? 'bg-brand-pink text-white border-brand-pink shadow'
                  : 'bg-vault-bg border-vault-border text-vault-subtext hover:border-brand-pink/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Immediate Lock & Cache Actions */}
      <div className="p-6 rounded-2xl bg-vault-surface border border-vault-border space-y-4">
        <h2 className="text-sm font-bold text-vault-text">Local Storage & Lock Actions</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              lockVault();
              navigate('/unlock');
            }}
            className="py-2.5 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold transition flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Vault Immediately</span>
          </button>

          <button
            onClick={handleClearLocalCache}
            className="py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold transition flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Local Document Cache</span>
          </button>
        </div>
      </div>

    </div>
  );
};
