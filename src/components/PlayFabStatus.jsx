/**
 * PlayFab Status Indicator - Shows connection status and player info
 */

import React, { useState, useEffect } from 'react';
import playfabService from '../services/playfabService';

const PlayFabStatus = ({ onLogin, showLoginPrompt = false }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = () => {
    if (playfabService.isLoggedIn) {
      setIsConnected(true);
      setPlayerName(playfabService.displayName || 'Player');
    } else if (playfabService.isConfigured()) {
      // Auto-login if configured
      handleLogin();
    }
  };

  const handleLogin = async () => {
    const result = await playfabService.loginAnonymously();
    if (result.success) {
      setIsConnected(true);
      setPlayerName(playfabService.displayName || 'Player');
      if (onLogin) onLogin(result);

      // Show name input for first-time users
      if (playfabService.displayName === 'Player') {
        setShowNameInput(true);
      }
    }
  };

  const handleSetName = async () => {
    if (nameInput.trim().length > 0) {
      await playfabService.setDisplayName(nameInput.trim());
      setPlayerName(nameInput.trim());
      setShowNameInput(false);
      setNameInput('');
    }
  };

  if (!playfabService.isConfigured()) {
    return (
      <div style={styles.notConfigured}>
        <span style={styles.warningIcon}>⚠️</span>
        <span style={styles.notConfiguredText}>
          PlayFab not configured - see PLAYFAB_SETUP.md
        </span>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div style={styles.nameInputContainer}>
        <div style={styles.namePrompt}>
          <h3 style={styles.nameTitle}>Choose Your Pilot Name</h3>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value.slice(0, 20))}
            placeholder="Enter your name"
            maxLength={20}
            style={styles.nameInput}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSetName()}
          />
          <div style={styles.nameButtons}>
            <button onClick={handleSetName} style={styles.setNameButton}>
              Confirm
            </button>
            <button onClick={() => setShowNameInput(false)} style={styles.skipButton}>
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{...styles.statusDot, background: isConnected ? '#0f0' : '#f00'}} />
      <span style={styles.text}>
        {isConnected ? (
          <>
            <span style={styles.cloudIcon}>☁️</span>
            <span style={styles.playerName}>{playerName}</span>
          </>
        ) : (
          showLoginPrompt && (
            <button onClick={handleLogin} style={styles.loginButton}>
              Connect to Cloud
            </button>
          )
        )}
      </span>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '2px solid rgba(0, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor',
    animation: 'pulse 2s infinite',
  },
  text: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cloudIcon: {
    fontSize: '16px',
  },
  playerName: {
    color: '#0ff',
  },
  loginButton: {
    padding: '6px 12px',
    background: '#0ff',
    border: 'none',
    borderRadius: '6px',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '12px',
  },
  notConfigured: {
    position: 'fixed',
    top: '10px',
    right: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 165, 0, 0.2)',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '2px solid #ff8800',
    zIndex: 1000,
  },
  warningIcon: {
    fontSize: '16px',
  },
  notConfiguredText: {
    color: '#ffaa00',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  nameInputContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  namePrompt: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '3px solid #0ff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 0 40px rgba(0, 255, 255, 0.5)',
  },
  nameTitle: {
    color: '#0ff',
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '24px',
    textShadow: '0 0 10px #0ff',
  },
  nameInput: {
    width: '100%',
    padding: '12px',
    fontSize: '18px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid #0ff',
    borderRadius: '8px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  nameButtons: {
    display: 'flex',
    gap: '12px',
  },
  setNameButton: {
    flex: 2,
    padding: '12px',
    background: '#0ff',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
  skipButton: {
    flex: 1,
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

// Add pulse animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(styleSheet);

export default PlayFabStatus;
