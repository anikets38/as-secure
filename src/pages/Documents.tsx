import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, DEFAULT_CATEGORIES } from '@/lib/db/db';
import { DocumentRecord } from '@/types';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { syncCloudDocumentMetadata } from '@/services/sync/syncService';
import { getDecryptedDocumentBlobUrl, deleteDocumentService } from '@/services/documents/documentService';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  X,
  WifiOff,
  Cloud,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const Documents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedDocId = searchParams.get('id');
  const { activeKey } = useVault();
  const { session } = useAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Sync category state whenever searchParams changes
  useEffect(() => {
    const catFromUrl = searchParams.get('category') || 'all';
    setSelectedCategory(catFromUrl);
  }, [searchParams]);

  useEffect(() => {
    loadDocuments();
  }, [session.user?.id]);

  async function loadDocuments() {
    if (session.user?.id) {
      await syncCloudDocumentMetadata(session.user.id);
    }
    const docs = await db.documents.orderBy('updatedAt').reverse().toArray();
    setDocuments(docs);
  }

  useEffect(() => {
    let result = documents;

    if (selectedCategory && selectedCategory !== 'all') {
      const catTarget = selectedCategory.toLowerCase();
      result = result.filter(d => {
        const docCat = (d.categoryId || '').toLowerCase();
        return docCat === catTarget || docCat.includes(catTarget.replace('cat_', ''));
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    setFilteredDocs(result);

    // Auto open doc preview if query param id exists
    if (selectedDocId && documents.length > 0) {
      const target = documents.find(d => d.id === selectedDocId);
      if (target) {
        handleOpenPreview(target);
      }
    }
  }, [documents, selectedCategory, searchQuery, selectedDocId]);

  const handleOpenPreview = async (doc: DocumentRecord) => {
    if (!activeKey) {
      alert('Vault key is locked.');
      return;
    }

    setPreviewDoc(doc);
    setLoadingPreview(true);
    setPreviewError(null);

    const res = await getDecryptedDocumentBlobUrl(doc.id, activeKey);

    setLoadingPreview(false);

    if (res.error) {
      setPreviewError(res.error);
    } else if (res.url) {
      setPreviewBlobUrl(res.url);
      setPreviewMimeType(res.mimeType || doc.mimeType);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl); // Revoke memory blob URL to prevent memory leaks!
    }
    setPreviewDoc(null);
    setPreviewBlobUrl(null);
    setPreviewMimeType(null);
    setPreviewError(null);
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document from your vault?')) {
      await deleteDocumentService(docId);
      handleClosePreview();
      loadDocuments();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
            Document Vault <span className="brand-text-gradient font-normal">({filteredDocs.length})</span>
          </h1>
          <p className="text-xs text-vault-muted mt-0.5">
            Manage your personal Aadhaar, PAN, Passport, and certificates.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-vault-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-vault-surface border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-vault-surface border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
          >
            <option value="all">All Categories</option>
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-vault-surface border border-vault-border text-center space-y-2">
          <FileText className="w-8 h-8 text-vault-muted mx-auto" />
          <p className="text-sm font-semibold text-vault-text">No matching documents found</p>
          <p className="text-xs text-vault-muted">Try adjusting your category filter or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-vault-surface border border-vault-border hover:border-brand-pink/40 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink font-bold text-xs shrink-0">
                    {doc.mimeType.includes('pdf') ? 'PDF' : 'IMG'}
                  </div>
                  <div className="flex items-center space-x-1">
                    {doc.localAvailable && (
                      <span className="p-1 rounded bg-emerald-500/10 text-emerald-400" title="Available Offline">
                        <WifiOff className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="p-1 rounded bg-brand-pink/10 text-brand-pink" title="AES-GCM Encrypted">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-vault-text line-clamp-1">{doc.title}</h3>
                  <p className="text-[11px] text-vault-muted">
                    {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {doc.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-vault-secondary text-vault-subtext border border-vault-border">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-vault-border flex items-center justify-between">
                <button
                  onClick={() => handleOpenPreview(doc)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-gradient text-white font-semibold text-xs shadow-vault-glow hover:opacity-95 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-vault-muted hover:text-rose-400 transition"
                  title="Delete Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Decrypted Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-vault-surface border border-vault-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-vault-border flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-vault-text truncate">{previewDoc.title}</h2>
                <p className="text-[11px] text-vault-muted">Decrypted in memory via Web Crypto API</p>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-vault-secondary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="flex-1 p-4 overflow-y-auto min-h-[350px] sm:min-h-[400px] flex items-center justify-center bg-vault-bg">
              {loadingPreview ? (
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-vault-muted">Decrypting document in memory...</p>
                </div>
              ) : previewError ? (
                <div className="text-center space-y-2 p-6 max-w-md">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-amber-400 font-semibold">{previewError}</p>
                </div>
              ) : previewBlobUrl ? (
                previewMimeType?.includes('pdf') ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4 p-2 sm:p-4 text-center">
                    {/* Desktop Iframe */}
                    <iframe
                      src={previewBlobUrl}
                      className="w-full h-[550px] rounded-xl border border-vault-border hidden sm:block"
                      title="PDF Viewer"
                    />
                    {/* Mobile PDF Native Viewer Trigger Card */}
                    <div className="sm:hidden bg-vault-surface border border-vault-border p-6 rounded-2xl w-full max-w-sm space-y-4 text-center shadow-vault-sm">
                      <div className="w-14 h-14 rounded-2xl bg-brand-pink/15 text-brand-pink mx-auto flex items-center justify-center font-extrabold text-sm shadow-vault-glow">
                        PDF
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-vault-text">{previewDoc.title}</h4>
                        <p className="text-xs text-vault-muted">
                          Decrypted in memory. Mobile browsers use native PDF readers for full view.
                        </p>
                      </div>
                      <a
                        href={previewBlobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-brand-gradient text-white text-xs font-bold w-full shadow-vault-glow hover:opacity-95 transition"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Open PDF in Mobile Reader</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <img
                    src={previewBlobUrl}
                    alt={previewDoc.title}
                    className="max-h-[500px] sm:max-h-[600px] object-contain rounded-xl shadow"
                  />
                )
              ) : null}
            </div>

            {/* Modal Footer Controls */}
            {previewBlobUrl && (
              <div className="p-4 border-t border-vault-border flex items-center justify-between">
                <a
                  href={previewBlobUrl}
                  download={previewDoc.title}
                  className="flex items-center space-x-2 py-2 px-4 rounded-xl bg-brand-pink/15 text-brand-pink border border-brand-pink/30 text-xs font-semibold hover:bg-brand-pink hover:text-white transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Decrypted File</span>
                </a>

                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 rounded-xl bg-vault-secondary text-vault-text text-xs font-semibold hover:bg-vault-border transition"
                >
                  Close Viewer
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
