import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VaultProvider, useVault } from '@/contexts/VaultContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

import { Login } from '@/pages/Login';
import { Unlock } from '@/pages/Unlock';
import { Dashboard } from '@/pages/Dashboard';
import { Documents } from '@/pages/Documents';
import { UploadPage } from '@/pages/Upload';
import { Categories } from '@/pages/Categories';
import { SearchPage } from '@/pages/Search';
import { Backup } from '@/pages/Backup';
import { Settings } from '@/pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, isLoading } = useAuth();
  const { isVaultUnlocked } = useVault();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vault-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isVaultUnlocked) {
    return <Navigate to="/unlock" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { session } = useAuth();
  const { isVaultUnlocked } = useVault();

  const showNavigation = session.isAuthenticated && isVaultUnlocked;

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex flex-col">
      {showNavigation && <Navbar />}

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {showNavigation && <Sidebar />}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 min-w-0 ${!showNavigation ? 'w-full' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unlock" element={<Unlock />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/backup"
              element={
                <ProtectedRoute>
                  <Backup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {showNavigation && <MobileNav />}
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VaultProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </VaultProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
