# AS Secure — Your Private Document Vault

**AS Secure** is a zero-knowledge, browser-encrypted, offline-first personal document manager built for storing sensitive documents like Aadhaar, PAN card, Passport, Driving Licence, Marksheets, Certificates, and Financial files.

---

## Key Features

- 🔐 **Zero-Knowledge Architecture**: Files are encrypted inside your browser using Web Crypto API (`AES-GCM` 256-bit + `PBKDF2-SHA-256`) *before* cloud upload.
- 📱 **Multi-Device & Offline Access**: Syncs across devices when online. Downloaded documents remain accessible 100% offline via IndexedDB.
- 🎨 **Premium Aesthetic**: Signature Rose/Coral brand accents (`#D65DB1` → `#FF6F91` → `#FF9671`) with Light, Deep Navy Dark, and OS System theme modes.
- ⏰ **Auto-Lock Security**: Automatic key purge timer from browser memory upon inactivity or tab blur.
- 📂 **Categories & Search**: Fast local indexing by categories (Identity, Education, Finance, etc.) and tags.
- 📦 **Encrypted Backup & Restore**: Export and restore password-protected snapshot bundles (`.assecure`).
- ⚡ **Installable PWA**: Progressive Web App with offline service worker application shell.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router DOM, Lucide React
- **Local Storage**: IndexedDB via Dexie.js
- **Cryptography**: Browser Web Crypto API (`crypto.subtle`)
- **Cloud Backend**: Supabase Auth + Private Supabase Storage + Postgres Metadata (optional)
- **Deployment**: Vercel

---

## Getting Started

### 1. Installation

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### 2. Environment Setup (Optional for Cloud Sync)

Copy `.env.example` to `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
```

*Note: If left blank, AS Secure seamlessly operates in Local-First IndexedDB Mode.*

---

## Security Model

1. **Dual Password Separation**:
   - **Account Password**: Authenticates session with Supabase Auth.
   - **Vault Master Password**: Derives local AES-GCM 256 key via 100,000 PBKDF2 iterations with a 16-byte random salt.
2. **No Secret Transmissions**: The Vault Master Password and raw CryptoKeys NEVER leave your browser device.
3. **Storage Security**: Cloud storage bucket (`documents`) stores binary blobs with Row Level Security (RLS) policies scoped strictly to `auth.uid()`.

---

## License & Security Disclaimer

AS Secure is open for personal privacy use. Keep your Master Vault Password and `.assecure` backup files safe. If lost, zero-knowledge encryption renders document files unrecoverable.
