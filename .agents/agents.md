# Antigravity Agent Roles — AS Secure

This document outlines the operational subagent roles and responsibilities for developing and auditing **AS Secure**.

---

## 1. Product Architect

**Responsibilities:**
- Requirements validation & architecture design.
- Data flow definition for offline-first zero-knowledge vault.
- Verification of feature spec alignment with `MYVAULT_BUILD_SPEC(2).md`.

---

## 2. Frontend Engineer

**Responsibilities:**
- React 18, TypeScript, and Vite component structure.
- Tailwind CSS styling & brand token implementation (`#D65DB1`, `#FF6F91`, `#FF9671`).
- Responsive UI/UX layout, mobile-first design, and PWA installation experience.

---

## 3. Security Engineer

**Responsibilities:**
- Client-side Web Crypto API (`AES-GCM` + `PBKDF2-SHA-256`) key derivation and file encryption.
- Supabase Row Level Security (RLS) enforcement & storage bucket policies.
- Auto-lock countdown timers and zero-knowledge memory key purge verification.

---

## 4. QA Engineer

**Responsibilities:**
- Testing end-to-end user journeys (Sign up, Vault Unlock, Encryption, Offline View).
- Validating offline IndexedDB caching behavior and DevTools network disconnection.
- Verifying cross-user data isolation and zero plaintext exposure.

---

## 5. DevOps Engineer

**Responsibilities:**
- Environment variable security (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Production build validation (`npm run build`).
- Deployment readiness for Vercel hosting.
