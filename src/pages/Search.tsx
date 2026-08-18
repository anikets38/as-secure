import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/db';
import { DocumentRecord } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, FileText, Eye, ShieldCheck } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const q = query.toLowerCase();
      const docs = await db.documents.toArray();
      const filtered = docs.filter(d => 
        d.title.toLowerCase().includes(q) ||
        d.tags.some(t => t.toLowerCase().includes(q)) ||
        d.mimeType.toLowerCase().includes(q)
      );
      setResults(filtered);
    }

    performSearch();
  }, [query]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
          Search <span className="brand-text-gradient">Vault</span>
        </h1>
        <p className="text-xs text-vault-muted mt-0.5">
          Fast zero-knowledge search across your cached document titles and tags.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="w-5 h-5 text-vault-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Aadhaar, Passport, PAN, 10th marksheet, #important..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-vault-surface border border-vault-border text-sm text-vault-text focus:outline-none focus:border-brand-pink shadow-vault-sm transition"
        />
      </div>

      {query.trim() && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-vault-muted">
            Found {results.length} result{results.length === 1 ? '' : 's'} for "{query}"
          </p>

          <div className="space-y-2">
            {results.map(doc => (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents?id=${doc.id}`)}
                className="p-4 rounded-2xl bg-vault-surface border border-vault-border hover:border-brand-pink/40 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink font-bold text-xs">
                    {doc.mimeType.includes('pdf') ? 'PDF' : 'IMG'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-vault-text">{doc.title}</h3>
                    <p className="text-[11px] text-vault-muted">
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • Created {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-brand-pink font-semibold">
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
