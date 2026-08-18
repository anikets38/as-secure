import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeDefaultCategories } from './lib/db/db';

// Initialize pre-populated default categories in IndexedDB
initializeDefaultCategories().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
