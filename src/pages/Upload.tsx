import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { uploadDocumentService } from '@/services/documents/documentService';
import { DEFAULT_CATEGORIES } from '@/lib/db/db';
import { Upload as UploadIcon, FileText, CheckCircle2, ShieldCheck, AlertCircle, X } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB safeguard

export const UploadPage: React.FC = () => {
  const { activeKey } = useVault();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('cat_identity');
  const [tagsInput, setTagsInput] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg('File size exceeds the 50MB safe limit for browser memory encryption.');
      return;
    }
    setErrorMsg(null);
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a document file.');
      return;
    }
    if (!activeKey) {
      setErrorMsg('Vault key is locked. Please unlock your vault.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const res = await uploadDocumentService({
      file: selectedFile,
      title: title || selectedFile.name,
      categoryId,
      tags,
      expiryDate: expiryDate || undefined,
      key: activeKey,
      userId: session.user?.id
    });

    setIsUploading(false);

    if (res.success) {
      navigate('/documents');
    } else {
      setErrorMsg(res.error || 'Failed to encrypt and store document.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
          Upload Document to <span className="brand-text-gradient">Vault</span>
        </h1>
        <p className="text-xs text-vault-muted mt-0.5">
          Documents are encrypted in browser memory with AES-GCM 256 before saving locally or uploading.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Dropzone File Selector */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition cursor-pointer ${
            dragActive 
              ? 'border-brand-pink bg-brand-pink/10' 
              : selectedFile
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-vault-border bg-vault-surface hover:border-brand-pink/40'
          }`}
        >
          {selectedFile ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-vault-bg border border-vault-border text-left">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-vault-text truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-vault-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 text-vault-muted hover:text-vault-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer space-y-3 block">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                onChange={(e) => e.target.files?.[0] && processSelectedFile(e.target.files[0])}
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-pink/10 flex items-center justify-center text-brand-pink">
                <UploadIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-vault-text">
                  Drag & Drop document or <span className="text-brand-pink underline">browse files</span>
                </p>
                <p className="text-[10px] text-vault-muted mt-1">
                  Supports PDF, JPG, PNG, WebP, DOCX (Max size: 50MB)
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Metadata Inputs */}
        <div className="space-y-4 bg-vault-surface border border-vault-border p-5 rounded-2xl">
          
          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1">
              Document Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Passport Renewal 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-vault-subtext mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-vault-subtext mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-vault-subtext mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="important, original, 2026, identity"
              className="w-full px-3.5 py-2.5 rounded-xl bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

        </div>

        {/* Zero Knowledge Security Guarantee */}
        <div className="p-3.5 rounded-xl bg-vault-surface border border-vault-border flex items-center space-x-2 text-xs text-vault-muted">
          <ShieldCheck className="w-4 h-4 text-brand-pink shrink-0" />
          <span>File contents are encrypted with AES-GCM 256 in browser memory before cloud upload.</span>
        </div>

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="w-full py-3 px-4 rounded-xl bg-brand-gradient text-white font-bold text-xs shadow-vault-glow hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <span>{isUploading ? 'Encrypting & Storing...' : 'Encrypt & Save to Vault'}</span>
        </button>

      </form>

    </div>
  );
};
