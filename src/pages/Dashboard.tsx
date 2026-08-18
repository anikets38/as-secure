import React, { useEffect, useState } from 'react';
import { db, DEFAULT_CATEGORIES } from '@/lib/db/db';
import { DocumentRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { syncCloudDocumentMetadata } from '@/services/sync/syncService';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  WifiOff,
  Cloud,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Upload,
  Search,
  FolderOpen
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    offline: 0,
    synced: 0
  });
  const [expiringDocs, setExpiringDocs] = useState<DocumentRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      if (session.user?.id) {
        await syncCloudDocumentMetadata(session.user.id);
      }
      const allDocs = session.user?.id
        ? await db.documents.where('userId').equals(session.user.id).toArray()
        : await db.documents.orderBy('updatedAt').reverse().toArray();
        
      setDocuments(allDocs);

      const total = allDocs.length;
      const offline = allDocs.filter(d => d.localAvailable).length;
      const synced = allDocs.filter(d => d.syncStatus === 'synced').length;

      setStats({ total, offline, synced });

      // Calculate docs expiring in next 45 days
      const now = new Date();
      const next45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

      const expiring = allDocs.filter(doc => {
        if (!doc.expiryDate) return false;
        const exp = new Date(doc.expiryDate);
        return exp >= now && exp <= next45Days;
      });

      setExpiringDocs(expiring);
    }

    loadData();
  }, [session.user?.id]);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-vault-surface border border-vault-border shadow-vault-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-glow blur-2xl pointer-events-none rounded-full" />
        <div className="space-y-1 z-10">
          <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
            Welcome to <span className="brand-text-gradient">AS Secure</span> Vault
          </h1>
          <p className="text-xs sm:text-sm text-vault-muted">
            Your personal documents are encrypted with AES-GCM and stored securely.
          </p>
        </div>
        <div className="flex items-center space-x-3 z-10">
          <Link
            to="/upload"
            className="flex items-center space-x-2 py-2.5 px-4 rounded-xl bg-brand-gradient text-white font-semibold text-xs shadow-vault-glow hover:opacity-95 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid (Section 58 of spec) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-vault-surface border border-vault-border space-y-2">
          <div className="flex items-center justify-between text-brand-pink">
            <span className="text-xs font-semibold text-vault-muted">Total Documents</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-vault-text">{stats.total}</p>
          <span className="text-[11px] text-vault-muted">Stored in personal vault</span>
        </div>

        <div className="p-4 rounded-2xl bg-vault-surface border border-vault-border space-y-2">
          <div className="flex items-center justify-between text-brand-coral">
            <span className="text-xs font-semibold text-vault-muted">Available Offline</span>
            <WifiOff className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-vault-text">{stats.offline}</p>
          <span className="text-[11px] text-vault-muted">Cached on this device</span>
        </div>

        <div className="p-4 rounded-2xl bg-vault-surface border border-vault-border space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold text-vault-muted">Cloud Synced</span>
            <Cloud className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-vault-text">{stats.synced}</p>
          <span className="text-[11px] text-vault-muted">Encrypted in cloud</span>
        </div>

        <div className="p-4 rounded-2xl bg-vault-surface border border-vault-border space-y-2">
          <div className="flex items-center justify-between text-brand-peach">
            <span className="text-xs font-semibold text-vault-muted">Vault Security</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-lg font-bold text-emerald-400">Protected</p>
          <span className="text-[11px] text-vault-muted">AES-256 + PBKDF2</span>
        </div>

      </div>

      {/* Expiring Soon Alert Banner */}
      {expiringDocs.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Documents Expiring Soon ({expiringDocs.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {expiringDocs.map(doc => (
              <div key={doc.id} className="p-2.5 rounded-xl bg-vault-surface border border-vault-border flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-vault-text">{doc.title}</p>
                  <p className="text-amber-400 text-[11px]">Expires: {doc.expiryDate}</p>
                </div>
                <Link to={`/documents?id=${doc.id}`} className="text-brand-pink hover:underline text-[11px] font-semibold">View</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Shortcuts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-vault-text flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-brand-pink" />
            <span>Document Categories</span>
          </h2>
          <Link to="/categories" className="text-xs text-brand-pink hover:underline font-semibold flex items-center space-x-1">
            <span>Manage</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {DEFAULT_CATEGORIES.slice(0, 10).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/documents?category=${cat.id}`)}
              className="p-3 rounded-xl bg-vault-surface border border-vault-border hover:border-brand-pink/40 text-left transition group space-y-1.5"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:bg-brand-pink group-hover:text-white transition">
                <FolderOpen className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-vault-text truncate">{cat.name.split(' (')[0]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Documents Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-vault-text flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-coral" />
            <span>Recent Documents</span>
          </h2>
          <Link to="/documents" className="text-xs text-brand-pink hover:underline font-semibold">View All</Link>
        </div>

        {documents.length === 0 ? (
          /* Empty State (Section 59 of spec) */
          <div className="p-8 rounded-2xl bg-vault-surface border border-vault-border text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-pink/10 flex items-center justify-center text-brand-pink">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-vault-text">No documents yet</h3>
              <p className="text-xs text-vault-muted max-w-sm mx-auto">
                Add your first Aadhaar, Passport, Marksheet or Certificate to start building your encrypted private vault.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 py-2 px-4 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-vault-glow hover:opacity-95 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Add Document</span>
            </Link>
          </div>
        ) : (
          <div className="bg-vault-surface border border-vault-border rounded-2xl overflow-hidden shadow-vault-sm">
            <div className="divide-y divide-vault-border">
              {documents.slice(0, 5).map(doc => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/documents?id=${doc.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-vault-secondary/50 cursor-pointer transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink shrink-0 font-extrabold text-xs">
                      {doc.mimeType.includes('pdf') ? 'PDF' : 'IMG'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-vault-text truncate">{doc.title}</p>
                      <p className="text-[11px] text-vault-muted">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {doc.localAvailable && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Available Offline
                      </span>
                    )}
                    <span className="text-xs text-brand-pink font-semibold">View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
