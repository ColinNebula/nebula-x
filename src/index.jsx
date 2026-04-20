import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA functionality (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    const swPath = `${base}service-worker.js`.replace(/\/+/g, '/');

    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log('✅ PWA: Service Worker registered', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.log('❌ PWA: Service Worker registration failed', error);
      });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  console.log('ℹ️ PWA: Service Worker disabled in development mode');
}
