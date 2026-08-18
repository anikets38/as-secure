import React, { useState } from 'react';
import { exportEncryptedVaultBackup, restoreEncryptedVaultBackup } from '@/services/backup/backupService';
import { DatabaseBackup, Download, Upload, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Backup: React.FC = () => {
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassword) return;

    setExporting(true);
    setMsg(null);

    const res = await exportEncryptedVaultBackup(backupPassword);
    setExporting(false);

    if (res.success) {
      setMsg({ type: 'success', text: `Encrypted backup downloaded: ${res.filename}` });
      setBackupPassword('');
    } else {
      setMsg({ type: 'error', text: res.error || 'Export failed' });
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile || !restorePassword) return;

    setRestoring(true);
    setMsg(null);

    const res = await restoreEncryptedVaultBackup(restoreFile, restorePassword);
    setRestoring(false);

    if (res.success) {
      setMsg({ type: 'success', text: `Vault restored successfully! ${res.restoredDocCount} documents restored.` });
      setRestoreFile(null);
      setRestorePassword('');
    } else {
      setMsg({ type: 'error', text: res.error || 'Restore failed' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
          Encrypted <span className="brand-text-gradient">Backup & Restore</span>
        </h1>
        <p className="text-xs text-vault-muted mt-0.5">
          Export or restore zero-knowledge encrypted vault snapshot bundles (`.assecure`).
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="p-6 rounded-2xl bg-vault-surface border border-vault-border space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-vault-text">Export Encrypted Backup Bundle</h2>
            <p className="text-[11px] text-vault-muted">Creates an encrypted `.assecure` backup containing all your document files & metadata.</p>
          </div>
        </div>

        <form onSubmit={handleExport} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1">
              Backup Encryption Password
            </label>
            <input
              type="password"
              required
              value={backupPassword}
              onChange={(e) => setBackupPassword(e.target.value)}
              placeholder="Enter password to encrypt backup file..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          <button
            type="submit"
            disabled={exporting || !backupPassword}
            className="py-2.5 px-4 rounded-xl bg-brand-gradient text-white font-bold text-xs shadow-vault-glow hover:opacity-95 transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Generating Encrypted Backup...' : 'Export Backup (.assecure)'}</span>
          </button>
        </form>
      </div>

      {/* Restore Section */}
      <div className="p-6 rounded-2xl bg-vault-surface border border-vault-border space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-coral/10 flex items-center justify-center text-brand-coral">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-vault-text">Restore Vault from Backup</h2>
            <p className="text-[11px] text-vault-muted">Restore your local vault from an `.assecure` encrypted backup file.</p>
          </div>
        </div>

        <form onSubmit={handleRestore} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1">
              Select `.assecure` File
            </label>
            <input
              type="file"
              required
              accept=".assecure,.json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="w-full px-3.5 py-2 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1">
              Backup Password
            </label>
            <input
              type="password"
              required
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              placeholder="Enter password used during export..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          <button
            type="submit"
            disabled={restoring || !restoreFile || !restorePassword}
            className="py-2.5 px-4 rounded-xl bg-brand-pink/15 text-brand-pink border border-brand-pink/30 hover:bg-brand-pink hover:text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{restoring ? 'Decrypting & Restoring Vault...' : 'Restore Backup'}</span>
          </button>
        </form>
      </div>

    </div>
  );
};
