import React, { useEffect, useState } from 'react';
import { db, DEFAULT_CATEGORIES } from '@/lib/db/db';
import { Category } from '@/types';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, FileText } from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [newCatName, setNewCatName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const cats = await db.categories.toArray();
    setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);

    const docs = await db.documents.toArray();
    const counts: Record<string, number> = {};

    docs.forEach(d => {
      counts[d.categoryId] = (counts[d.categoryId] || 0) + 1;
    });

    setDocCounts(counts);
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      iconName: 'Folder',
      isCustom: true
    };

    await db.categories.put(newCat);
    setNewCatName('');
    loadCategories();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-vault-text">
          Document <span className="brand-text-gradient">Categories</span>
        </h1>
        <p className="text-xs text-vault-muted mt-0.5">
          Organize your personal documents by category.
        </p>
      </div>

      {/* Add Custom Category Form */}
      <form onSubmit={handleAddCategory} className="flex items-center gap-2 p-3 bg-vault-surface border border-vault-border rounded-xl">
        <input
          type="text"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder="New Category Name (e.g. Tax Returns)..."
          className="flex-1 px-3.5 py-2 rounded-lg bg-vault-bg border border-vault-border text-xs text-vault-text focus:outline-none focus:border-brand-pink transition"
        />
        <button
          type="submit"
          className="flex items-center space-x-1.5 py-2 px-4 rounded-lg bg-brand-gradient text-white text-xs font-bold shadow-vault-glow hover:opacity-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/documents?category=${cat.id}`)}
            className="p-4 rounded-2xl bg-vault-surface border border-vault-border hover:border-brand-pink/40 cursor-pointer transition space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink shrink-0">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-vault-text truncate">{cat.name}</h3>
                <p className="text-[11px] text-vault-muted">
                  {docCounts[cat.id] || 0} document{(docCounts[cat.id] || 0) === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-brand-pink pt-2 border-t border-vault-border">
              <span>View Folder</span>
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
