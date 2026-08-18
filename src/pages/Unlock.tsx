import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const Unlock: React.FC = () => {
  const { isVaultCreated, unlockVault, createVault } = useVault();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter vault password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    if (!isVaultCreated) {
      if (password.length < 6) {
        setErrorMsg('Vault password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        setLoading(false);
        return;
      }

      const res = await createVault(password);
      setLoading(false);

      if (res.success) {
        navigate('/dashboard');
      } else {
        setErrorMsg(res.error || 'Failed to create vault.');
      }
    } else {
      const res = await unlockVault(password);
      setLoading(false);

      if (res.success) {
        navigate('/dashboard');
      } else {
        setErrorMsg(res.error || 'Incorrect vault password.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      <div className="w-full max-w-md bg-vault-surface border border-vault-border rounded-2xl p-6 sm:p-8 shadow-vault-md relative z-10 space-y-6">
        
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gradient flex items-center justify-center shadow-vault-glow">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-vault-text">
              {isVaultCreated ? 'Unlock Your Vault' : 'Set Up Vault Password'}
            </h1>
            <p className="text-xs text-vault-muted mt-1 font-medium">
              {isVaultCreated 
                ? 'Enter your Master Vault Password to derive encryption keys in browser memory.'
                : 'Choose a strong Master Vault Password. It derives your local Web Crypto encryption keys.'}
            </p>
          </div>
        </div>

        {/* Security Warning Alert */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Zero-Knowledge Security:</strong> Your Vault Password is never sent to Supabase or stored on disk. If lost, your encrypted files cannot be decrypted.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1.5">
              Vault Master Password
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-sm text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          {!isVaultCreated && (
            <div>
              <label className="block text-xs font-semibold text-vault-subtext mb-1.5">
                Confirm Master Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-sm text-vault-text focus:outline-none focus:border-brand-pink transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-vault-glow hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Deriving Keys...' : isVaultCreated ? 'Unlock Vault' : 'Create Encrypted Vault'}</span>
            {isVaultCreated ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
        </form>

      </div>
    </div>
  );
};
