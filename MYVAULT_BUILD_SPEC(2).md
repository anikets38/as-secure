# AS Secure — Product Identity

## Official App Name

**AS Secure**

### Brand meaning

- **AS** = Aniket Shinde
- **Secure** = private, encrypted personal document protection

### Product tagline

**AS Secure — Your Private Document Vault**

Use **AS Secure** consistently throughout the application, browser title, PWA name, manifest, login screen, dashboard, README, and deployment branding.

Do not use the previous placeholder name `AS Secure` in user-facing UI.

---

# Visual Theme

Use a **premium dark navy + electric blue + cyan** security-focused theme.

## Core palette

```text
Primary Background:       #0B1120
Secondary Background:     #111827
Card Background:          #172033
Elevated Surface:         #1E293B

Primary Accent:           #3B82F6
Secondary Accent:         #06B6D4
Accent Glow:              #22D3EE

Primary Text:             #F8FAFC
Secondary Text:           #94A3B8
Muted Text:               #64748B

Success:                  #22C55E
Warning:                  #F59E0B
Danger:                   #EF4444
Border:                   #273449
```

## Theme direction

The visual style should communicate:

- Security
- Privacy
- Trust
- Modern technology
- Simplicity
- Premium personal software

Use dark navy as the main background rather than pure black. Use blue as the primary interactive colour and cyan sparingly for security/active states.

Avoid making every element brightly coloured. Accent colours should guide attention, not dominate the interface.

## Suggested visual treatment

```text
Background
████████████████████████████████  #0B1120

Cards
████████████████████████████████  #172033

Primary buttons
████████████████████████████████  #3B82F6

Secondary/active accents
████████████████████████████████  #06B6D4

Main text
████████████████████████████████  #F8FAFC
```

### Logo direction

Create a minimal logo using the letters:

**AS**

Possible concept:

```text
╭────────╮
│   AS   │
╰────────╯
```

Use a simple shield/lock visual only if it remains clean. Avoid a generic overly detailed cybersecurity logo.

### Login screen branding

```text
        🔐
     AS SECURE

 Your Private Document Vault

   [ Email ]
   [ Password ]

      [ Sign In ]

  Private • Encrypted • Offline
```

### Dashboard branding

```text
AS SECURE
Your Private Document Vault
```

Use the primary blue accent for important actions and cyan only for subtle highlights such as secure/synced indicators.

---

# AS Secure — Full Antigravity Build Script

## 1. Project Goal

Build a private personal document vault called **AS Secure**.

The application is intended for one person and will store personal documents such as:

- Aadhaar
- PAN card
- Passport
- Driving licence
- 10th/12th marksheets
- College certificates
- Resume
- Bank documents
- Insurance documents
- Other important PDFs/images

The application must be deployed on **Vercel** and must support:

1. Multi-device access.
2. Offline access after a document has been synced/downloaded to that device.
3. Client-side encryption before cloud upload.
4. Private cloud storage.
5. Search, categories, tags and document management.
6. Responsive desktop/mobile UI.
7. PWA installation and offline application shell.
8. Encrypted backup/export and restore.
9. No custom backend server maintained by the developer.
10. No plaintext personal documents uploaded to cloud storage.

> Important reality: a different device cannot access a document that has never been synchronized to it while that device is offline. A device needs internet at least once to authenticate and sync/download a document. After that, the locally cached copy can be opened offline.

---

# 2. Technology Stack

Use this stack unless there is a strong technical reason to change it:

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React icons

### Cloud

- Supabase Auth
- Supabase Storage
- Supabase Postgres for document metadata only

### Local storage

- IndexedDB
- Dexie.js

### Security

- Web Crypto API
- AES-GCM for file encryption
- PBKDF2-SHA-256 or another browser-native password-based key derivation mechanism
- Never store the user's master password.
- Never store the raw encryption key in the database.

### Offline/PWA

- Service Worker
- Web App Manifest
- Workbox or a reliable Vite PWA integration

### Deployment

- Vercel

---

# 3. Important Security Principle

The most important rule is:

**The user's actual document contents must be encrypted in the browser before upload.**

The intended flow is:

```text
User selects document
        ↓
Browser reads file
        ↓
Browser encrypts file
        ↓
Encrypted blob is created
        ↓
Encrypted blob uploaded to private Supabase Storage
        ↓
Only encrypted document exists in cloud storage
```

The cloud should receive metadata such as:

- document ID
- owner user ID
- encrypted file object path
- category
- title
- encrypted file name if privacy is required
- MIME type if acceptable
- file size
- created date
- updated date
- local sync status

Do not upload plaintext documents.

---

# 4. Authentication

Use Supabase Auth for the account/session layer.

The first screen should be:

```text
AS SECURE

Your Private Document Vault

[ Email ]
[ Password ]

[ Sign In ]

Don't have an account?
[ Create Account ]
```

After successful authentication, show the vault unlock screen if the application uses an additional local vault password.

Distinguish clearly between:

### Account password

Used for Supabase authentication.

### Vault password

Used to derive the local encryption key.

Do not silently use the Supabase password as the encryption key.

The vault password should never be sent to the server.

---

# 5. Vault Encryption Design

Implement a secure client-side encryption service.

Create:

```text
src/lib/crypto/
  crypto.ts
  keyDerivation.ts
  encryption.ts
  decryption.ts
  types.ts
```

### Key derivation

When the user creates the vault:

1. Generate a random salt using `crypto.getRandomValues()`.
2. Derive a cryptographic key from the vault password.
3. Store only the salt and required non-secret metadata.
4. Never store the password.
5. Never store the plaintext derived key in Supabase.

### File encryption

For every document:

1. Generate a fresh random IV.
2. Encrypt the file using AES-GCM.
3. Store the IV with the encrypted file metadata.
4. Store the encrypted blob in private storage.

Do not reuse an IV with the same AES-GCM key.

### Encryption metadata example

```ts
{
  version: 1,
  algorithm: "AES-GCM",
  iv: "...",
  saltId: "...",
  keyVersion: 1
}
```

Do not hard-code secrets.

---

# 6. Local Offline Storage

Use IndexedDB through Dexie.js.

Create:

```text
src/lib/db/
  db.ts
  documentStore.ts
  settingsStore.ts
  syncStore.ts
```

Suggested local tables:

```text
documents
cachedFiles
syncQueue
settings
vaultMetadata
```

### Local document record

```ts
{
  id: string,
  title: string,
  categoryId: string,
  tags: string[],
  cloudPath: string,
  mimeType: string,
  size: number,
  createdAt: string,
  updatedAt: string,
  localAvailable: boolean,
  syncStatus: "synced" | "pending" | "error",
  encryptedMetadata: boolean
}
```

Do not assume IndexedDB is permanent backup.

Provide an encrypted backup/export feature.

---

# 7. Supabase Database

Create a `documents` table.

Suggested fields:

```sql
id uuid primary key
user_id uuid not null
title text
category_id text
tags text[]
storage_path text not null
mime_type text
file_size bigint
encryption_version integer not null default 1
created_at timestamptz
updated_at timestamptz
```

If privacy is a priority, consider encrypting sensitive metadata such as:

- title
- original filename
- category
- tags

At minimum, the actual document contents must be encrypted.

---

# 8. Row Level Security

Enable RLS.

Every user must only be able to access their own document metadata.

Rules:

```text
Authenticated user
       ↓
Can SELECT own rows
Can INSERT own rows
Can UPDATE own rows
Can DELETE own rows
       ↓
Cannot access another user's rows
```

Never create a policy that gives every authenticated user access to all documents.

---

# 9. Supabase Storage

Create a **private** bucket:

```text
documents
```

Do not make the bucket public.

Use a path structure such as:

```text
{user_id}/{document_id}/encrypted.bin
```

Example:

```text
abc-user-id/
    8b2c-document-id/
        encrypted.bin
```

The service key must NEVER be placed in frontend code.

Only use the public/publishable Supabase client key in the frontend.

Use Storage RLS/policies to ensure users can only access their own folder.

---

# 10. Application Pages

Create these routes:

```text
/
 /login
 /signup
 /verify
 /unlock
 /dashboard
 /documents
 /documents/:id
 /upload
 /categories
 /search
 /settings
 /backup
 /about
```

Protected routes must require authentication.

Vault-protected routes must additionally require the vault to be unlocked.

---

# 11. Dashboard

Design a clean premium dashboard.

Header:

```text
AS SECURE                         🔔  👤
Private Document Vault
```

Main statistics:

```text
Total Documents
Available Offline
Cloud Synced
Storage Used
```

Categories:

```text
Identity
Education
Finance
Employment
Medical
Travel
Property
Other
```

Recent documents:

```text
Recent Documents
----------------------------------
Aadhaar Card             PDF
PAN Card                 PDF
B.Tech Marksheet         PDF
Resume                   PDF
```

Show sync status:

```text
✓ Synced
⟳ Syncing
⚠ Needs Sync
📴 Offline
```

---

# 12. Document Upload

Create a polished upload page/modal.

Support:

- Drag and drop
- File picker
- Multiple files
- PDF
- JPG
- JPEG
- PNG
- WebP
- Optional DOCX support

For each selected file:

```text
File selected
     ↓
Validate type
     ↓
Validate size
     ↓
Generate document ID
     ↓
Encrypt
     ↓
Save encrypted copy locally
     ↓
Upload encrypted blob
     ↓
Save metadata
     ↓
Mark synced
```

Do not upload plaintext first.

---

# 13. Document Viewer

When the user opens a document:

```text
Encrypted local/cloud file
          ↓
Decrypt in browser memory
          ↓
Create temporary Blob URL
          ↓
Show viewer
```

For PDFs:

- Use browser PDF viewing or a suitable PDF viewer.
- Do not permanently expose decrypted files through public URLs.

For images:

- Display decrypted image blob.

Add:

```text
View
Download
Share
Delete
Make Available Offline
Remove Offline Copy
```

The `Share` option must not automatically expose a public cloud URL.

---

# 14. Search

Implement local search for cached documents.

Search by:

- title
- category
- tags
- document type

Example:

```text
Search documents...

"passport"
```

Results:

```text
Passport
Passport Renewal
Passport Photo
```

For privacy, avoid sending search queries to an external AI or analytics service.

---

# 15. Categories

Default categories:

```text
Identity
Education
Finance
Employment
Travel
Insurance
Property
Medical
Certificates
Other
```

Allow the user to:

- Create category
- Rename category
- Delete category
- Change category icon
- Assign documents

Do not delete documents automatically when deleting a category.

---

# 16. Tags

Allow tags such as:

```text
important
original
2026
college
government
expiry
renewal
```

Users can add/remove tags.

---

# 17. Expiry Dates

Add optional fields:

```text
Expiry Date
Reminder Date
```

Useful for:

- Passport
- Driving licence
- Insurance
- Certificates
- IDs

Dashboard should show:

```text
Expiring Soon
```

For example:

```text
Passport
Expires in 42 days
```

Do not require a notification backend initially.

Use browser notifications only if permission is granted.

---

# 18. Offline Mode

Implement PWA functionality.

The app shell should remain available offline.

Cache:

- HTML
- JS
- CSS
- icons
- app assets

Documents should be explicitly cached locally.

When offline:

```text
User opens app
      ↓
PWA loads
      ↓
Authentication session/local state checked
      ↓
Vault unlock
      ↓
IndexedDB documents displayed
      ↓
User can open locally available documents
```

If a document has not been downloaded before, show:

```text
This document is not available offline.

Connect to the internet once to download it.
```

---

# 19. Sync Engine

Create:

```text
src/services/sync/
  syncEngine.ts
  uploadQueue.ts
  downloadQueue.ts
  conflictResolver.ts
  syncStatus.ts
```

Sync should work like:

```text
ONLINE
  ↓
Detect pending local changes
  ↓
Encrypt if necessary
  ↓
Upload
  ↓
Update metadata
  ↓
Mark synced
```

For downloads:

```text
Cloud document
  ↓
Download encrypted blob
  ↓
Store encrypted blob locally
  ↓
Mark localAvailable = true
```

When connection returns:

```text
OFFLINE
  ↓
Local changes queued
  ↓
ONLINE
  ↓
Queue processed automatically
```

Show a sync indicator.

---

# 20. Conflict Handling

For a single-user application, keep conflict handling simple.

If the same document changes on two devices:

```text
Compare updated_at
       ↓
Newest version wins
```

But never silently destroy data.

Keep an optional previous encrypted version or backup when replacing a document.

Show:

```text
A newer version of this document exists.

[ Keep Local ]
[ Use Cloud Version ]
[ Save Both ]
```

---

# 21. Backup and Restore

This is a critical feature.

Create:

```text
Backup Vault
Restore Vault
```

Export an encrypted backup file:

```text
as-secure-backup.as-secure
```

The backup should contain:

```text
encrypted documents
document metadata
categories
tags
vault metadata
encryption metadata
```

The entire backup must be encrypted.

Never export plaintext documents into a backup archive by default.

Restore flow:

```text
Select .as-secure backup
       ↓
Enter vault password
       ↓
Verify backup
       ↓
Decrypt metadata
       ↓
Restore local database
       ↓
Restore files
```

Add a warning:

```text
Keep your backup file in a safe place.
If you lose your vault password and your backup/encryption design
does not provide recovery, encrypted data may be unrecoverable.
```

---

# 22. Security Settings

Settings page should include:

```text
Security

Change Vault Password
Lock Vault
Auto Lock
Session Management
Clear Local Cache
Export Encrypted Backup
Restore Backup
Delete Local Copies
```

Auto-lock options:

```text
Never
5 minutes
15 minutes
30 minutes
1 hour
```

When locked:

```text
Documents are hidden
Encryption key removed from active memory
User must unlock again
```

Do not pretend that JavaScript memory guarantees perfect secure erasure; simply release references and minimize key lifetime.

---

# 23. UI/UX Requirements

The application must look like a modern premium personal vault.

Design style:

- Minimal
- Professional
- Clean
- Privacy-focused
- Responsive
- Mobile-first
- No unnecessary animations

Use:

- rounded cards
- subtle shadows
- clean typography
- clear status badges
- accessible contrast
- responsive sidebar
- bottom navigation on mobile if appropriate

Avoid:

- excessive gradients
- excessive glassmorphism
- huge animations
- unnecessary charts
- distracting UI

---

# 24. Mobile UI

The application must work well on:

- Android Chrome
- iPhone Safari
- Desktop Chrome
- Edge
- Firefox

Mobile dashboard:

```text
AS SECURE
--------------------
Search

Categories

Identity
Education
Finance
Other

Recent Documents

Aadhaar.pdf
PAN.pdf
Passport.pdf
```

Use large touch targets.

---

# 25. PWA Installation

Create:

```text
manifest.webmanifest
```

Include:

```text
name: AS Secure
short_name: AS Secure
display: standalone
theme_color
background_color
icons
```

Add install guidance.

Example:

```text
Install AS Secure on this device

[ Install ]
```

Do not display this prompt if the browser already reports the application is installed.

---

# 26. Offline Indicator

Always show a small status indicator:

```text
🟢 Online
```

or

```text
📴 Offline
```

When offline, explain:

```text
You're offline.
Only documents available on this device can be opened.
Changes will sync when you reconnect.
```

---

# 27. Storage Usage

Create a storage page:

```text
Local Storage

Used: 1.8 GB
Available: Browser-dependent

Cloud Storage

Used: 2.4 GB
```

Show:

```text
Documents Available Offline: 18
Documents Cloud Synced: 22
Pending Sync: 1
```

Do not claim exact browser storage limits unless measured through the browser.

---

# 28. Error Handling

Never show raw technical errors to the user.

Instead:

```text
Upload failed.

Your document is still safely stored locally.
We'll retry when you're online.

[ Retry Now ]
```

For authentication:

```text
Unable to sign in.
Please check your email and password.
```

For encryption:

```text
We couldn't securely process this document.
The original file has not been uploaded.
```

For offline cloud action:

```text
You're offline.
This action will be queued until you reconnect.
```

---

# 29. Loading States

Every asynchronous operation needs a clear loading state.

Examples:

```text
Encrypting document...
Uploading securely...
Downloading...
Decrypting...
Restoring backup...
Syncing...
```

Never freeze the UI without feedback.

---

# 30. File Validation

Before encryption/upload:

Check:

- file type
- file size
- empty files
- corrupted files where practical
- duplicate filename/document ID

Use configurable limits.

Do not hard-code an unnecessarily small limit.

For large files, design the code so the encryption/upload layer can later be replaced with streaming/chunked processing.

For the first version, use a safe documented file-size limit and show it in the UI.

---

# 31. Duplicate Detection

Calculate a local cryptographic hash of the plaintext file before encryption when appropriate.

Use it only for duplicate detection.

Do not send plaintext hashes to third-party analytics.

Optionally store:

```text
content_hash
```

in encrypted metadata or locally.

If a duplicate is detected:

```text
A similar document already exists.

[ Upload Anyway ]
[ Cancel ]
```

---

# 32. Privacy Rules

The app must have:

```text
NO Google Analytics
NO advertising SDK
NO tracking pixels
NO document telemetry
NO document content logging
NO plaintext file logging
NO plaintext passwords in logs
```

Do not log:

```text
file contents
vault password
encryption keys
personal document names
personal document metadata
```

Production logging should be minimal.

---

# 33. Environment Variables

Create:

```text
.env.example
```

Example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Do not put:

```text
SUPABASE_SERVICE_ROLE_KEY
```

in the frontend.

Never commit `.env`.

Create:

```text
.gitignore
```

with:

```text
.env
.env.local
node_modules
dist
```

---

# 34. Project Structure

Use this structure:

```text
as-secure/
│
├── public/
│   ├── icons/
│   ├── favicon.ico
│   └── manifest.webmanifest
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── dashboard/
│   │   ├── categories/
│   │   ├── backup/
│   │   ├── security/
│   │   └── common/
│   │
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Unlock.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Documents.tsx
│   │   ├── DocumentDetails.tsx
│   │   ├── Upload.tsx
│   │   ├── Categories.tsx
│   │   ├── Search.tsx
│   │   ├── Backup.tsx
│   │   └── Settings.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── crypto/
│   │   ├── db/
│   │   ├── pwa/
│   │   └── utils/
│   │
│   ├── services/
│   │   ├── documents/
│   │   ├── sync/
│   │   ├── backup/
│   │   └── storage/
│   │
│   ├── hooks/
│   ├── contexts/
│   ├── types/
│   ├── routes/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── supabase/
│   └── migrations/
│
├── .agents/
│   ├── agents.md
│   ├── skills/
│   └── workflows/
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── vite.config.ts
```

---

# 35. Antigravity Working Rules

You are building this application inside Google Antigravity.

Use an agentic development workflow.

Before coding:

1. Inspect the current workspace.
2. Create a technical specification.
3. Confirm the architecture.
4. Create the application structure.
5. Implement in small phases.
6. Test every phase.
7. Fix errors before moving forward.
8. Do not replace working code unnecessarily.
9. Do not create fake functionality.
10. Do not claim a feature works until it has been tested.

Antigravity supports project instructions, agents and skills through `.agents` workflows. Use them to keep the development process organized.

---

# 36. Antigravity Agent Roles

Create:

```text
.agents/agents.md
```

Define:

### Product Architect

Responsible for:

- requirements
- architecture
- data flow
- security requirements

### Frontend Engineer

Responsible for:

- React
- TypeScript
- Tailwind
- UI
- routing
- PWA

### Security Engineer

Responsible for:

- encryption
- key management
- authentication
- authorization
- RLS
- secure storage

### QA Engineer

Responsible for:

- functional testing
- responsive testing
- offline testing
- authentication testing
- encryption/decryption testing
- sync testing

### DevOps Engineer

Responsible for:

- Vercel build
- environment variables
- production configuration
- deployment checks

---

# 37. Development Phases

Do NOT build everything in one huge step.

Build in these phases.

## Phase 1 — Project Setup

Create:

- React
- Vite
- TypeScript
- Tailwind
- routing
- ESLint
- basic layout

Test:

```bash
npm install
npm run dev
npm run build
```

---

## Phase 2 — Authentication

Implement:

- Supabase client
- signup
- login
- logout
- session persistence
- protected routes

Test:

- create account
- login
- logout
- refresh page
- unauthorized access

---

## Phase 3 — Vault Security

Implement:

- vault creation
- password-based key derivation
- salt
- unlock
- lock
- auto-lock

Test:

- correct password
- incorrect password
- reload
- lock/unlock

---

## Phase 4 — Local Database

Implement:

- Dexie
- document metadata
- local encrypted blobs
- categories
- settings

Test:

- add
- read
- update
- delete
- refresh
- offline

---

## Phase 5 — Encryption

Implement:

- AES-GCM encryption
- decryption
- IV generation
- metadata/versioning

Test:

```text
Original file
    ↓
Encrypt
    ↓
Encrypted blob
    ↓
Decrypt
    ↓
Compare with original
```

The decrypted file must match the original.

---

## Phase 6 — Supabase Database

Implement:

- documents table
- RLS
- user ownership

Test with two accounts.

Account A must never be able to access Account B's metadata.

---

## Phase 7 — Cloud Storage

Implement:

- private bucket
- upload encrypted blob
- download encrypted blob
- delete
- storage policies

Test:

```text
User A upload
User A download
User A delete
User B cannot access User A file
```

---

## Phase 8 — Sync

Implement:

- upload queue
- download queue
- offline queue
- retry
- sync status

Test:

```text
Device A
  ↓
Upload document
  ↓
Device B
  ↓
Sync document
  ↓
Offline
  ↓
Open document
```

---

## Phase 9 — PWA

Implement:

- service worker
- manifest
- icons
- offline shell
- install experience

Test using browser DevTools offline mode.

---

## Phase 10 — Backup/Restore

Implement:

- encrypted backup
- restore
- password verification
- integrity verification

Test:

```text
Create vault
Add 5 documents
Export backup
Delete local data
Restore backup
Verify all 5 documents
```

---

## Phase 11 — UI Polish

Improve:

- responsive layout
- loading states
- empty states
- error messages
- mobile navigation
- accessibility
- dark/light theme if desired

---

## Phase 12 — Production QA

Test:

### Authentication

- signup
- login
- logout
- refresh
- session expiry

### Documents

- upload
- view
- download
- delete
- rename
- categories
- tags

### Security

- wrong vault password
- cross-user access
- public URL check
- plaintext upload check
- service key absence

### Offline

- install PWA
- disconnect internet
- open app
- open cached documents
- create local changes
- reconnect
- verify sync

### Multi-device

Test:

```text
Laptop → upload
Phone → sync
Phone → offline
Phone → view
```

---

# 38. Vercel Deployment

Prepare production build:

```bash
npm run build
```

Verify:

```bash
npm run preview
```

Then deploy to Vercel.

Add only safe public environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Never deploy secret/service-role keys.

After deployment test:

```text
Vercel URL
    ↓
Login
    ↓
Unlock
    ↓
Upload encrypted document
    ↓
Cloud sync
    ↓
Open second device
    ↓
Download/sync
    ↓
Turn internet OFF
    ↓
Open cached document
```

---

# 39. README Requirements

Create a detailed README containing:

1. Project overview
2. Features
3. Architecture
4. Security model
5. Tech stack
6. Local setup
7. Supabase setup
8. Database SQL
9. Storage bucket setup
10. RLS policies
11. Environment variables
12. Vercel deployment
13. Offline behavior
14. Backup/restore
15. Known limitations
16. Security warnings

---

# 40. Important Known Limitation

The application must clearly communicate:

**Offline does not mean magically synchronized between devices.**

Example:

```text
Laptop
  └── Document A downloaded locally

Phone
  └── Document A not downloaded

Internet OFF

Laptop → can open Document A
Phone  → cannot open Document A
```

Once the phone gets internet:

```text
Phone → sync/download Document A → offline copy available
```

This is expected behavior.

---

# 41. Do Not Implement These Initially

Do not add:

- AI document analysis
- OCR
- face recognition
- document sharing
- public links
- social login
- analytics
- advertisements
- complex collaboration
- multi-user organizations
- unnecessary backend servers

Keep V1 focused.

---

# 42. Future Features

Possible V2 features:

- OCR
- automatic document categorization
- expiry reminders
- duplicate detection improvements
- document thumbnails
- encrypted sharing
- passkeys/WebAuthn
- device management
- version history
- stronger chunked encryption for very large files
- optional local network sync

Do not implement these until V1 is stable.

---

# 43. Critical Security Checklist

Before calling the project complete, verify:

- [ ] Documents are encrypted before upload.
- [ ] Supabase bucket is private.
- [ ] Supabase service role key is not in frontend.
- [ ] RLS is enabled.
- [ ] User A cannot access User B files.
- [ ] Vault password is never stored.
- [ ] Encryption key is not stored as plaintext.
- [ ] AES-GCM IV is unique per encryption operation.
- [ ] No plaintext documents are logged.
- [ ] No analytics SDK exists.
- [ ] No public document URLs are generated by default.
- [ ] Offline documents are stored locally.
- [ ] Encrypted backup works.
- [ ] Restore works.
- [ ] Logout clears appropriate sensitive application state.
- [ ] Locking the vault removes active key references.
- [ ] Wrong vault password cannot decrypt documents.

---

# 44. Final Antigravity Instruction

You are not allowed to simply generate a visual mockup.

Build a **working application**.

For every feature:

1. Implement it.
2. Run the application.
3. Test it.
4. Fix errors.
5. Verify the feature.
6. Continue to the next phase.

If you encounter a technical limitation:

- Explain it clearly.
- Do not fake the feature.
- Choose the safest practical alternative.
- Update the documentation.

Do not expose secrets.

Do not use service-role credentials in frontend code.

Do not upload plaintext personal documents.

Do not make the storage bucket public.

Do not skip RLS.

Do not claim offline synchronization between devices without explaining that each device must first sync the required documents.

The final result should be a polished, secure, responsive, installable **AS Secure Personal Document Manager** deployed on Vercel, using Supabase for authentication/metadata/private encrypted storage, IndexedDB for offline copies, and browser-side encryption for document confidentiality.

---

# 45. First Command to Give Antigravity

After placing this specification in the project workspace, tell Antigravity:

> Read the complete `AS SECURE_BUILD_SPEC.md` specification.
>
> Do not start by generating the entire application.
>
> First inspect the workspace and create a technical implementation plan based on the specification.
>
> Identify any security, architecture, browser, PWA, Supabase, encryption, or offline limitations.
>
> Then create the initial project structure and implement Phase 1 only.
>
> Run the development server and production build.
>
> Fix all errors.
>
> Report exactly what was created, what was tested, and what remains for Phase 2.
>
> Do not move to Phase 2 until Phase 1 is working.

---

# 46. Suggested Antigravity Workflow

Use the following development cycle:

```text
SPECIFICATION
      ↓
ARCHITECTURE REVIEW
      ↓
PHASE IMPLEMENTATION
      ↓
RUN APPLICATION
      ↓
AUTOMATED CHECKS
      ↓
MANUAL TEST
      ↓
SECURITY REVIEW
      ↓
FIX BUGS
      ↓
APPROVE PHASE
      ↓
NEXT PHASE
```

This approach is preferable to asking an AI coding agent to generate the entire secure document vault in a single prompt.

---

# 47. Final Product Definition

At the end, the application should behave like this:

```text
                    AS SECURE
                       │
                       ▼
                Supabase Auth
                       │
                       ▼
                  Vault Unlock
                       │
             ┌─────────┴─────────┐
             │                   │
          ONLINE               OFFLINE
             │                   │
             ▼                   ▼
       Cloud Sync          IndexedDB Local
             │                   │
             ▼                   ▼
      Encrypted Files       Cached Files
             │                   │
             └─────────┬─────────┘
                       ▼
                Browser Decryption
                       │
                       ▼
                Document Viewer
```

### Core promise

**One private vault. Multiple devices. Encrypted cloud synchronization. Offline access to documents already downloaded on that device.**

Do not claim that the application can access a document on a device that has never synchronized it while completely offline.


---


# 49. Approved Brand Colour Palette — AS Secure

The uploaded reference palette must be incorporated into the application design.

The supplied palette contains these approved brand colours:

```text
#D65DB1  — Rose / Orchid Pink
#FF6F91  — Coral Pink
#FF9671  — Peach / Warm Coral
```

These colours should become the **brand accent palette** of AS Secure.

## Recommended use

### Primary Brand

```text
#D65DB1
```

Use for:

- AS Secure logo accent
- Primary brand highlights
- Selected navigation states
- Active tabs
- Important focus states
- Subtle decorative elements

### Secondary Brand

```text
#FF6F91
```

Use for:

- Primary CTA buttons
- Hover states
- Important actions
- Progress indicators
- Active controls

### Tertiary Brand

```text
#FF9671
```

Use for:

- Secondary CTA accents
- Category highlights
- Warning-like visual emphasis when it is not a semantic warning
- Gradient endpoints
- Decorative highlights

Do not use these three colours everywhere. They should remain accent colours so the application still feels professional.

---

# 50. Recommended AS Secure Brand Gradient

Use the brand colours together only in selected premium areas.

Recommended gradient:

```css
linear-gradient(
  135deg,
  #D65DB1 0%,
  #FF6F91 50%,
  #FF9671 100%
)
```

Use this gradient for:

- Login/landing hero accents
- Logo glow
- Selected premium cards
- Empty-state illustrations
- Small decorative background shapes
- Optional primary CTA background

Do NOT use the gradient as the entire page background.

---

# 51. Light and Dark Theme

AS Secure must support both:

```text
☀ Light Mode
🌙 Dark Mode
```

Add a theme switcher in the header/settings.

Recommended options:

```text
Light
Dark
System
```

The default should be **System** so the application follows the user's operating-system preference.

Persist the selected preference locally.

---

# 52. Light Theme

The light theme should be clean, premium and easy to read.

```text
Page Background:       #FFF9FC
Surface/Card:          #FFFFFF
Secondary Surface:     #FFF1F7
Border:                #F1DCE7

Primary Text:          #1F1720
Secondary Text:        #6B5A66
Muted Text:            #9A8994

Brand Primary:         #B84A98
Brand Secondary:       #E65378
Brand Tertiary:        #E87955

Success:               #16A34A
Warning:               #D97706
Danger:                #DC2626
Info:                  #2563EB
```

The three supplied brand colours can remain visible, but use darker accessible variants for small text and controls where necessary.

Example:

```text
Background
┌────────────────────────────────────────────┐
│ AS SECURE                         ☀ / 🌙  │
│                                            │
│  Your Private Document Vault               │
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Identity │ │Education │ │ Finance  │  │
│  └──────────┘ └──────────┘ └──────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

---

# 53. Dark Theme

The dark theme should use a deep navy base, with the supplied pink/coral palette as accents.

```text
Page Background:       #0B1120
Surface/Card:          #151B2B
Elevated Surface:      #1C2436
Secondary Surface:     #222B3D
Border:                #30394D

Primary Text:          #F8FAFC
Secondary Text:        #CBD5E1
Muted Text:            #94A3B8

Brand Primary:         #D65DB1
Brand Secondary:       #FF6F91
Brand Tertiary:        #FF9671

Success:               #22C55E
Warning:               #F59E0B
Danger:                #EF4444
Info:                  #60A5FA
```

The dark theme should feel like a **secure premium vault**, not like a generic developer dashboard.

---

# 54. Theme Behaviour

Implement theme tokens using CSS variables rather than hard-coding colours throughout components.

Example concept:

```css
:root {
  --brand-primary: #D65DB1;
  --brand-secondary: #FF6F91;
  --brand-tertiary: #FF9671;
}

[data-theme="light"] {
  --background: #FFF9FC;
  --surface: #FFFFFF;
  --text-primary: #1F1720;
}

[data-theme="dark"] {
  --background: #0B1120;
  --surface: #151B2B;
  --text-primary: #F8FAFC;
}
```

Use Tailwind-compatible design tokens or CSS variables so changing the theme does not require rewriting components.

---

# 55. Theme Switcher UX

Place the theme control in the top-right header.

Example:

```text
☀ Light   |   🌙 Dark
```

or a compact toggle:

```text
☀ ───── 🌙
```

Preferred behaviour:

```text
System
   ↓
Detect OS preference
   ↓
Use Light/Dark automatically

User manually selects theme
   ↓
Save preference
   ↓
Use selected theme on next visit
```

Avoid flashing the wrong theme during page load.

Apply the theme before rendering the main UI where practical.

---

# 56. Accessibility Requirements for the Brand Palette

The supplied colours are attractive brand colours, but they should not automatically be used as text on white backgrounds everywhere.

Follow these rules:

- Check text contrast.
- Use darker derived variants for small text where required.
- Keep primary body text near black in light mode.
- Keep primary body text near white in dark mode.
- Do not communicate status using colour alone.
- Add icons/text labels for success, warning and error states.
- Ensure keyboard focus is clearly visible.

Example:

```text
✓ Synced
⟳ Syncing
⚠ Needs attention
📴 Offline
```

Do not rely only on green/orange/red colour.

---

# 57. Additional UI Elements Recommended for AS Secure

Add the following because they fit the personal secure-vault concept.

## Security Status

Show a subtle security status in the dashboard:

```text
🔐 Vault Secure
```

When locked:

```text
🔒 Vault Locked
```

Do not claim that the vault is cryptographically secure merely because the user is authenticated. The status should represent the actual application state.

## Sync Status

```text
☁ Synced
⟳ Syncing
📴 Offline
⚠ Sync Pending
```

## Offline Availability

Each document should show:

```text
✓ Available Offline
```

or:

```text
☁ Cloud Only
```

This makes the multi-device/offline workflow easy to understand.

---

# 58. Recommended Dashboard Cards

Use four useful cards:

```text
┌─────────────────┐
│ 📄 Documents    │
│ 24              │
└─────────────────┘

┌─────────────────┐
│ 📴 Offline      │
│ 18 available    │
└─────────────────┘

┌─────────────────┐
│ ☁ Synced        │
│ 24 / 24         │
└─────────────────┘

┌─────────────────┐
│ 🔐 Vault        │
│ Protected       │
└─────────────────┘
```

Use subtle brand accents rather than four unrelated colours.

---

# 59. Recommended Empty States

For example:

```text
              📁

       No documents yet

Add your first document to start
building your private vault.

       [ + Add Document ]
```

Use a subtle #D65DB1 → #FF6F91 → #FF9671 decorative gradient.

---

# 60. Recommended Login Page

Make the login page the strongest branding screen.

```text
┌──────────────────────────────────────────────┐
│                                              │
│                    AS                        │
│                 SECURE                       │
│                                              │
│          Your Private Document Vault         │
│                                              │
│      ┌──────────────────────────────┐        │
│      │ Email                        │        │
│      └──────────────────────────────┘        │
│                                              │
│      ┌──────────────────────────────┐        │
│      │ Password                 👁  │        │
│      └──────────────────────────────┘        │
│                                              │
│      ┌──────────────────────────────┐        │
│      │          Sign In              │        │
│      └──────────────────────────────┘        │
│                                              │
│      Private • Encrypted • Offline           │
│                                              │
└──────────────────────────────────────────────┘
```

Use the approved gradient only as a subtle accent around the logo/button/illustration.

---

# 61. Recommended Security-Themed Visual Language

Use these visual concepts consistently:

- Lock
- Shield
- Key
- Cloud with lock
- Device synchronization
- Offline device
- Folder/document
- Checkmark

Use Lucide React icons rather than creating many custom SVG icons.

Do not overuse security icons. The product should feel like a **personal document manager with strong security**, not an antivirus application.

---

# 62. Final Visual Direction

The final AS Secure design should combine:

```text
                    AS SECURE

       Professional Document Management
                       +
                 Privacy & Security
                       +
                Offline Availability
                       +
                Multi-device Sync
                       +
             Pink / Coral Brand Identity
```

The final visual personality:

**Premium + Personal + Secure + Modern + Minimal**

The supplied palette is the brand identity; the navy/dark and white/light surfaces are supporting colours.

Do not replace the supplied brand palette with the previous blue/cyan-only identity.

# 48. Final Branding Requirement

The final application name is **AS Secure**.

The application must not use `MyVault` as a visible product name anywhere.

Recommended browser/PWA title:

```text
AS Secure — Your Private Document Vault
```

Recommended short PWA name:

```text
AS Secure
```

Recommended project/repository name:

```text
as-secure
```

Recommended backup extension:

```text
.assecure
```

Use the approved colour palette from the **Visual Theme** section consistently across all pages and components.
