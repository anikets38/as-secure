import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, signup, isLocalFirstMode } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('aniket.shinde21450@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = isSignUp 
      ? await signup(email, password)
      : await login(email, password);

    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      navigate('/unlock');
    }
  };

  return (
    <div className="min-h-screen bg-vault-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-glow blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md bg-vault-surface border border-vault-border rounded-2xl p-6 sm:p-8 shadow-vault-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-gradient flex items-center justify-center shadow-vault-glow">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-vault-text tracking-wide">
              AS <span className="brand-text-gradient">SECURE</span>
            </h1>
            <p className="text-xs text-vault-muted mt-1 font-medium">
              Your Private Document Vault
            </p>
          </div>
        </div>

        {/* Local-First Mode Alert Banner */}
        {isLocalFirstMode && (
          <div className="p-3 rounded-xl bg-brand-pink/10 border border-brand-pink/20 text-xs text-brand-pink space-y-1 text-center">
            <span className="font-bold">Local-First Vault Mode</span>
            <p className="text-[11px] opacity-90">
              Supabase cloud credentials not set. Accounts & documents will run strictly inside your browser's IndexedDB.
            </p>
          </div>
        )}

        {/* Form Error Display */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1.5">
              Account Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-sm text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1.5">
              Account Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-sm text-vault-text focus:outline-none focus:border-brand-pink transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-muted hover:text-vault-text"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-vault-glow hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
            }}
            className="text-xs text-vault-muted hover:text-brand-pink transition"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create Account"}
          </button>
        </div>

        {/* Privacy Footer Tagline */}
        <div className="pt-4 border-t border-vault-border text-center">
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-vault-muted">
            <Lock className="w-3.5 h-3.5 text-brand-pink" />
            <span>Private • Encrypted • Offline</span>
          </div>
        </div>

      </div>
    </div>
  );
};
