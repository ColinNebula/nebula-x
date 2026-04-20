/**
 * Leaderboard Component - Display global high scores from PlayFab
 */

import React, { useState, useEffect } from 'react';
import playfabService from '../services/playfabService';

const Leaderboard = ({ gameMode = 'campaign', onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerRank, setPlayerRank] = useState(null);
  const [selectedMode, setSelectedMode] = useState(gameMode);

  useEffect(() => {
    loadLeaderboard();
    loadPlayerRank();
  }, [selectedMode]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const result = await playfabService.getLeaderboard(selectedMode, 100);
    if (result.success) {
      setLeaderboard(result.leaderboard);
    }
    setLoading(false);
  };

  const loadPlayerRank = async () => {
    const result = await playfabService.getPlayerRank(selectedMode);
    if (result.success) {
      setPlayerRank(result);
    }
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'campaign': return '🎮 Campaign';
      case 'survival': return '⚡ Survival';
      case 'bossRush': return '💀 Boss Rush';
      case 'timeAttack': return '⏱️ Time Attack';
      default: return mode;
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>🏆 GLOBAL LEADERBOARD</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Mode Selector */}
        <div style={styles.modeSelector}>
          {['campaign', 'survival', 'bossRush', 'timeAttack'].map(mode => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              style={{
                ...styles.modeButton,
                ...(selectedMode === mode ? styles.modeButtonActive : {}),
              }}
            >
              {getModeLabel(mode)}
            </button>
          ))}
        </div>

        {/* Player Rank Banner */}
        {playerRank && (
          <div style={styles.playerRankBanner}>
            <span style={styles.playerRankText}>
              Your Rank: {getRankMedal(playerRank.rank)} - Score: {playerRank.score.toLocaleString()}
            </span>
          </div>
        )}

        {/* Leaderboard Table */}
        <div style={styles.leaderboardContainer}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.spinner}>⚙️</div>
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={styles.empty}>
              <p>No scores yet. Be the first! 🚀</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Rank</th>
                  <th style={{...styles.th, textAlign: 'left'}}>Player</th>
                  <th style={{...styles.th, textAlign: 'right'}}>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isPlayer = entry.playerId === playfabService.playerId;
                  return (
                    <tr
                      key={entry.playerId + index}
                      style={{
                        ...styles.tableRow,
                        ...(isPlayer ? styles.playerRow : {}),
                      }}
                    >
                      <td style={styles.td}>
                        <span style={styles.rankBadge}>{getRankMedal(entry.rank)}</span>
                      </td>
                      <td style={{...styles.td, textAlign: 'left'}}>
                        {entry.displayName}
                        {isPlayer && <span style={styles.youBadge}> (YOU)</span>}
                      </td>
                      <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>
                        {entry.score.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={loadLeaderboard} style={styles.refreshButton}>
            🔄 Refresh
          </button>
          <p style={styles.footerText}>
            {leaderboard.length} players ranked
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
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
    animation: 'fadeIn 0.2s',
  },
  container: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '3px solid #0ff',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 40px rgba(0, 255, 255, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '2px solid #0ff',
    paddingBottom: '12px',
  },
  title: {
    color: '#0ff',
    margin: 0,
    fontSize: '28px',
    textShadow: '0 0 10px #0ff',
  },
  closeButton: {
    background: '#f00',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  modeSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  modeButton: {
    flex: 1,
    minWidth: '120px',
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  modeButtonActive: {
    background: 'rgba(0, 255, 255, 0.3)',
    border: '2px solid #0ff',
    boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
  },
  playerRankBanner: {
    background: 'linear-gradient(90deg, #ffd700, #ffaa00)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  playerRankText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  leaderboardContainer: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '8px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#0ff',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 1s linear infinite',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
    fontSize: '18px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    background: 'rgba(0, 255, 255, 0.2)',
    color: '#0ff',
    position: 'sticky',
    top: 0,
  },
  th: {
    padding: '12px',
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottom: '2px solid #0ff',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'background 0.2s',
  },
  playerRow: {
    background: 'rgba(255, 215, 0, 0.2)',
    borderLeft: '4px solid #ffd700',
  },
  td: {
    padding: '12px',
    color: '#fff',
    textAlign: 'center',
  },
  rankBadge: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  youBadge: {
    color: '#ffd700',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '2px solid rgba(255, 255, 255, 0.2)',
    paddingTop: '12px',
  },
  refreshButton: {
    padding: '10px 20px',
    background: '#0ff',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
  footerText: {
    color: '#888',
    margin: 0,
    fontSize: '14px',
  },
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Leaderboard;
