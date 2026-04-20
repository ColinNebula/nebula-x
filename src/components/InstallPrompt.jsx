import React, { useState, useEffect } from 'react';

/**
 * InstallPrompt Component - Prompts users to install the PWA
 * Shows a custom install button when the browser's install prompt is available
 */
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show custom install button
      setShowInstallButton(true);
      console.log('PWA: Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWA: Already installed');
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No install prompt available');
      return;
    }

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User response: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt');
    } else {
      console.log('PWA: User dismissed the install prompt');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    // Save dismissal to localStorage (optional - prevents annoying users)
    localStorage.setItem('pwaInstallDismissed', Date.now());
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.prompt}>
        <div style={styles.content}>
          <span style={styles.icon}>🚀</span>
          <div style={styles.text}>
            <strong>Install Nebula X</strong>
            <p style={styles.subtitle}>Play offline, faster loading, full-screen experience</p>
          </div>
        </div>
        <div style={styles.buttons}>
          <button onClick={handleInstallClick} style={styles.installButton}>
            Install
          </button>
          <button onClick={handleDismiss} style={styles.dismissButton}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10000,
    animation: 'slideUp 0.3s ease-out',
  },
  prompt: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '90vw',
    width: '400px',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    color: 'white',
  },
  icon: {
    fontSize: '32px',
  },
  text: {
    flex: 1,
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    opacity: 0.9,
  },
  buttons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  installButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'transform 0.2s',
  },
  dismissButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
};

export default InstallPrompt;
