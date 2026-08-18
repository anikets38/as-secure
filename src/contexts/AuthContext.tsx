import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserSession } from '@/types';

interface AuthContextType {
  session: UserSession;
  isLoading: boolean;
  isLocalFirstMode: boolean;
  login: (email: string, pass: string) => Promise<{ error: string | null }>;
  signup: (email: string, pass: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<UserSession>({
    user: null,
    isAuthenticated: false,
    isVaultUnlocked: false
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Local-first mode: check if local demo user exists or create default session
      const storedLocalUser = localStorage.getItem('as_secure_local_user');
      if (storedLocalUser) {
        try {
          const user = JSON.parse(storedLocalUser);
          setSession({
            user,
            isAuthenticated: true,
            isVaultUnlocked: false
          });
        } catch {
          setSession({ user: null, isAuthenticated: false, isVaultUnlocked: false });
        }
      }
      setIsLoading(false);
      return;
    }

    // Live Supabase Auth
    supabase.auth.getSession().then(({ data: { session: supaSession } }) => {
      if (supaSession?.user) {
        setSession({
          user: { id: supaSession.user.id, email: supaSession.user.email || '' },
          isAuthenticated: true,
          isVaultUnlocked: false
        });
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, supaSession) => {
      if (supaSession?.user) {
        setSession(prev => ({
          ...prev,
          user: { id: supaSession.user.id, email: supaSession.user.email || '' },
          isAuthenticated: true
        }));
      } else {
        setSession({
          user: null,
          isAuthenticated: false,
          isVaultUnlocked: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      const demoUser = { id: 'local_user_001', email };
      localStorage.setItem('as_secure_local_user', JSON.stringify(demoUser));
      setSession({
        user: demoUser,
        isAuthenticated: true,
        isVaultUnlocked: false
      });
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signup = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      const demoUser = { id: 'local_user_001', email };
      localStorage.setItem('as_secure_local_user', JSON.stringify(demoUser));
      setSession({
        user: demoUser,
        isAuthenticated: true,
        isVaultUnlocked: false
      });
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('as_secure_local_user');
      setSession({ user: null, isAuthenticated: false, isVaultUnlocked: false });
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      isLoading,
      isLocalFirstMode: !isSupabaseConfigured,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
