import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { initializeDefaultCategories } from './lib/db/db';

// Register PWA Service Worker for 100% reliable offline app shell caching
registerSW({ immediate: true });

// Initialize pre-populated default categories in IndexedDB
initializeDefaultCategories().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
