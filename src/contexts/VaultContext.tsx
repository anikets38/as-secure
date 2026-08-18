import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { db } from '@/lib/db/db';
import { deriveVaultKey, verifyVaultPassword, createVaultVerificationPayload } from '@/lib/crypto/keyDerivation';
import { bufferToBase64, base64ToBuffer } from '@/lib/crypto/cryptoUtils';

interface VaultContextType {
  isVaultCreated: boolean;
  isVaultUnlocked: boolean;
  activeKey: CryptoKey | null;
  autoLockMinutes: number;
  setAutoLockMinutes: (mins: number) => Promise<void>;
  createVault: (password: string) => Promise<{ success: boolean; error?: string }>;
  unlockVault: (password: string) => Promise<{ success: boolean; error?: string }>;
  lockVault: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVaultCreated, setIsVaultCreated] = useState<boolean>(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(15);
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check vault initialization status on load
  useEffect(() => {
    async function checkVaultStatus() {
      const metadata = await db.vaultMetadata.get('vault_metadata');
      setIsVaultCreated(Boolean(metadata));

      const settings = await db.settings.get('vault_settings');
      if (settings?.autoLockMinutes !== undefined) {
        setAutoLockMinutesState(settings.autoLockMinutes);
      }
    }
    checkVaultStatus();
  }, []);

  // Auto-lock countdown timer handler
  const resetAutoLockTimer = () => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    if (autoLockMinutes > 0 && isVaultUnlocked) {
      autoLockTimerRef.current = setTimeout(() => {
        lockVault();
      }, autoLockMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (isVaultUnlocked && autoLockMinutes > 0) {
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      const handleActivity = () => resetAutoLockTimer();

      events.forEach(event => window.addEventListener(event, handleActivity));
      resetAutoLockTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
      };
    }
  }, [isVaultUnlocked, autoLockMinutes]);

  const lockVault = () => {
    setActiveKey(null);
    setIsVaultUnlocked(false);
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
  };

  const createVault = async (password: string) => {
    try {
      const { key, salt } = await deriveVaultKey(password);
      const { encryptedBuffer, iv } = await createVaultVerificationPayload(key);

      await db.vaultMetadata.put({
        id: 'vault_metadata',
        salt,
        keyVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Save encrypted verification payload to settings
      await db.settings.put({
        id: 'vault_settings',
        autoLockMinutes: 15,
        themePreference: 'dark',
        isLocalOnlyMode: true
      });

      // Store verification payload raw bytes in indexedDB cached table
      await db.cachedFiles.put({
        id: 'vault_verification_payload',
        encryptedBlob: encryptedBuffer,
        iv,
        mimeType: 'text/plain',
        updatedAt: new Date().toISOString()
      });

      setActiveKey(key);
      setIsVaultUnlocked(true);
      setIsVaultCreated(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create vault' };
    }
  };

  const unlockVault = async (password: string) => {
    try {
      const metadata = await db.vaultMetadata.get('vault_metadata');
      const payload = await db.cachedFiles.get('vault_verification_payload');

      if (!metadata || !payload) {
        return { success: false, error: 'Vault metadata missing or corrupted.' };
      }

      const key = await verifyVaultPassword(
        password,
        metadata.salt,
        payload.encryptedBlob,
        payload.iv
      );

      if (!key) {
        return { success: false, error: 'Incorrect vault password.' };
      }

      setActiveKey(key);
      setIsVaultUnlocked(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error unlocking vault' };
    }
  };

  const setAutoLockMinutes = async (mins: number) => {
    setAutoLockMinutesState(mins);
    const existing = await db.settings.get('vault_settings');
    await db.settings.put({
      id: 'vault_settings',
      autoLockMinutes: mins,
      themePreference: existing?.themePreference || 'dark',
      isLocalOnlyMode: existing?.isLocalOnlyMode ?? true
    });
  };

  return (
    <VaultContext.Provider value={{
      isVaultCreated,
      isVaultUnlocked,
      activeKey,
      autoLockMinutes,
      setAutoLockMinutes,
      createVault,
      unlockVault,
      lockVault
    }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
