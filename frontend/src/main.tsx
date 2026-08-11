import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Frontend Error Monitoring (Sentry Integration)
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
if (SENTRY_DSN && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[REALVION SENTRY FRONTEND ERROR]:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[REALVION SENTRY UNHANDLED REJECTION]:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

