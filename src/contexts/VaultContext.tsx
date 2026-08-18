import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { db } from '@/lib/db/db';
import { deriveVaultKey, verifyVaultPassword, createVaultVerificationPayload } from '@/lib/crypto/keyDerivation';
import { bufferToBase64, base64ToBuffer } from '@/lib/crypto/cryptoUtils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { session } = useAuth();
  const [isVaultCreated, setIsVaultCreated] = useState<boolean>(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(15);
  const autoLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize Vault salt & verification payload across all devices on load
  useEffect(() => {
    async function checkVaultStatus() {
      let metadata = await db.vaultMetadata.get('vault_metadata');
      let payload = await db.cachedFiles.get('vault_verification_payload');

      // Sync with Supabase Cloud if online & logged in
      if (session.user?.id && isSupabaseConfigured && navigator.onLine) {
        try {
          const { data: cloudVault } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('title', '__VAULT_SALT_PAYLOAD__')
            .maybeSingle();

          if (cloudVault && cloudVault.storage_path) {
            const parts = cloudVault.storage_path.split('::');
            if (parts.length === 3) {
              const [salt, verificationBlobBase64, verificationIvBase64] = parts;
              const now = new Date().toISOString();

              // If local salt differs from cloud salt, update local IndexedDB to match cloud
              if (!metadata || metadata.salt !== salt) {
                metadata = {
                  id: 'vault_metadata',
                  salt,
                  keyVersion: 1,
                  createdAt: now,
                  updatedAt: now
                };
                await db.vaultMetadata.put(metadata);

                const encryptedBuffer = base64ToBuffer(verificationBlobBase64);
                payload = {
                  id: 'vault_verification_payload',
                  encryptedBlob: encryptedBuffer,
                  iv: verificationIvBase64,
                  mimeType: 'text/plain',
                  updatedAt: now
                };
                await db.cachedFiles.put(payload);

                // Lock vault to ensure re-derivation with updated cloud salt
                setActiveKey(null);
                setIsVaultUnlocked(false);
              }
            }
          }
        } catch (cloudErr) {
          console.warn('Cloud vault settings sync deferred:', cloudErr);
        }
      }

      setIsVaultCreated(Boolean(metadata && payload));

      const settings = await db.settings.get('vault_settings');
      if (settings?.autoLockMinutes !== undefined) {
        setAutoLockMinutesState(settings.autoLockMinutes);
      }
    }
    checkVaultStatus();
  }, [session.user?.id]);

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
      const verificationBlobBase64 = bufferToBase64(encryptedBuffer);

      await db.vaultMetadata.put({
        id: 'vault_metadata',
        salt,
        keyVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await db.settings.put({
        id: 'vault_settings',
        autoLockMinutes: 15,
        themePreference: 'dark',
        isLocalOnlyMode: true
      });

      await db.cachedFiles.put({
        id: 'vault_verification_payload',
        encryptedBlob: encryptedBuffer,
        iv,
        mimeType: 'text/plain',
        updatedAt: new Date().toISOString()
      });

      // Sync vault salt & payload to Supabase Postgres for cross-device key derivation
      if (session.user?.id && isSupabaseConfigured && navigator.onLine) {
        const payloadString = `${salt}::${verificationBlobBase64}::${iv}`;
        await supabase.from('documents').upsert({
          id: '00000000-0000-0000-0000-000000000000',
          user_id: session.user.id,
          title: '__VAULT_SALT_PAYLOAD__',
          category_id: 'cat_system',
          storage_path: payloadString,
          mime_type: 'application/x-vault-settings',
          file_size: payloadString.length,
          encryption_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

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
      let metadata = await db.vaultMetadata.get('vault_metadata');
      let payload = await db.cachedFiles.get('vault_verification_payload');

      if ((!metadata || !payload) && session.user?.id && isSupabaseConfigured && navigator.onLine) {
        const { data: cloudVault } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('title', '__VAULT_SALT_PAYLOAD__')
          .maybeSingle();

        if (cloudVault && cloudVault.storage_path) {
          const parts = cloudVault.storage_path.split('::');
          if (parts.length === 3) {
            const [salt, verificationBlobBase64, verificationIvBase64] = parts;
            const now = new Date().toISOString();

            metadata = {
              id: 'vault_metadata',
              salt,
              keyVersion: 1,
              createdAt: now,
              updatedAt: now
            };
            await db.vaultMetadata.put(metadata);

            const encryptedBuffer = base64ToBuffer(verificationBlobBase64);
            payload = {
              id: 'vault_verification_payload',
              encryptedBlob: encryptedBuffer,
              iv: verificationIvBase64,
              mimeType: 'text/plain',
              updatedAt: now
            };
            await db.cachedFiles.put(payload);
          }
        }
      }

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

      // Sync vault salt & payload to Supabase Postgres if missing
      if (session.user?.id && isSupabaseConfigured && navigator.onLine) {
        const payloadString = `${metadata.salt}::${bufferToBase64(payload.encryptedBlob)}::${payload.iv}`;
        await supabase.from('documents').upsert({
          id: '00000000-0000-0000-0000-000000000000',
          user_id: session.user.id,
          title: '__VAULT_SALT_PAYLOAD__',
          category_id: 'cat_system',
          storage_path: payloadString,
          mime_type: 'application/x-vault-settings',
          file_size: payloadString.length,
          encryption_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
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
