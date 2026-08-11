import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Website Error Monitoring (Sentry Integration)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
if (SENTRY_DSN && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[REALVION WEBSITE SENTRY ERROR]:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[REALVION WEBSITE SENTRY UNHANDLED REJECTION]:', event.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

