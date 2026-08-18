import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  Search,
  Settings
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const items = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Docs', path: '/documents', icon: FileText },
    { label: 'Upload', path: '/upload', icon: Upload, isCenter: true },
    { label: 'Search', path: '/search', icon: Search },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-vault-surface/95 backdrop-blur-md border-t border-vault-border px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.isCenter) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-vault-glow">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-brand-pink mt-1">{item.label}</span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-brand-pink' : 'text-vault-muted hover:text-vault-text'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
