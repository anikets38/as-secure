import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  FolderOpen,
  Search,
  DatabaseBackup,
  Settings,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Documents', path: '/documents', icon: FileText },
    { label: 'Upload Document', path: '/upload', icon: Upload },
    { label: 'Categories', path: '/categories', icon: FolderOpen },
    { label: 'Search Vault', path: '/search', icon: Search },
    { label: 'Backup & Restore', path: '/backup', icon: DatabaseBackup },
    { label: 'Vault Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-vault-border bg-vault-surface/40 min-h-[calc(100vh-4rem)] p-4 space-y-6">
      
      {/* Quick Action Button */}
      <NavLink
        to="/upload"
        className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-brand-gradient text-white font-semibold shadow-vault-glow hover:opacity-95 transition"
      >
        <Upload className="w-4 h-4" />
        <span>+ Add Document</span>
      </NavLink>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? 'bg-brand-pink/15 text-brand-pink border border-brand-pink/30 font-semibold'
                    : 'text-vault-subtext hover:text-vault-text hover:bg-vault-secondary'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Privacy Guarantee Footer Note */}
      <div className="p-3.5 rounded-xl bg-vault-secondary/60 border border-vault-border text-xs text-vault-muted space-y-1">
        <div className="flex items-center space-x-1.5 font-semibold text-brand-pink">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Zero-Knowledge Vault</span>
        </div>
        <p className="text-[11px] leading-relaxed text-vault-muted">
          Your documents are encrypted locally with AES-GCM before cloud upload.
        </p>
      </div>

    </aside>
  );
};
