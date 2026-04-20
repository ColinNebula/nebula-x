/**
 * PlayFab Integration Example for SpaceShooter.jsx
 *
 * This file shows how to integrate PlayFab into your existing SpaceShooter component.
 * Copy the relevant sections into your SpaceShooter.jsx file.
 */

// ============================================
// 1. ADD IMPORTS AT THE TOP
// ============================================

import { usePlayFab } from '../hooks/usePlayFab';
import Leaderboard from './Leaderboard';
import PlayFabStatus from './PlayFabStatus';

// ============================================
// 2. ADD STATE INSIDE SpaceShooter COMPONENT
// ============================================

const SpaceShooter = () => {
  // Existing state...
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(/* ... */);

  // 🆕 Add PlayFab hook
  const {
    isConnected,
    submitScore: submitScoreToCloud,
    trackEvent,
    saveProgress,
    updateStats,
    syncWithCloud,
  } = usePlayFab();

  // 🆕 Add leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // ============================================
  // 3. SYNC WITH CLOUD ON GAME START
  // ============================================

  useEffect(() => {
    const initCloudSync = async () => {
      if (isConnected) {
        // Get local data
        const localData = {
          highScore: parseInt(localStorage.getItem('spaceShooterHighScore')) || 0,
          gameBeaten: localStorage.getItem('nebulaXGameBeaten') === 'true',
          highestWave: parseInt(localStorage.getItem('nebulaXHighestWave')) || 1,
          achievements: JSON.parse(localStorage.getItem('nebulaXAchievements') || '[]'),
        };

        // Sync with cloud (merges local + cloud, keeps best)
        const { mergedData } = await syncWithCloud(localData);

        // Update local state with merged data
        if (mergedData) {
          if (mergedData.highScore > highScore) {
            setHighScore(mergedData.highScore);
            localStorage.setItem('spaceShooterHighScore', mergedData.highScore);
          }
          if (mergedData.achievements.length > 0) {
            setUnlockedAchievements(mergedData.achievements);
            localStorage.setItem('nebulaXAchievements', JSON.stringify(mergedData.achievements));
          }
        }
      }
    };

    initCloudSync();
  }, [isConnected]);

  // ============================================
  // 4. SUBMIT SCORE ON GAME OVER
  // ============================================

  // Find your existing game over logic and modify it:

  const handleGameOver = async () => {
    setGameState('gameOver');

    // Update high score
    if (score > highScore) {
      const newHighScore = score;
      setHighScore(newHighScore);
      localStorage.setItem('spaceShooterHighScore', newHighScore);

      // 🆕 Submit to cloud leaderboard
      if (isConnected) {
        await submitScoreToCloud(newHighScore, gameMode);
        console.log('✅ Score submitted to leaderboard:', newHighScore);
      }
    }

    // 🆕 Update statistics
    if (isConnected) {
      await updateStats({
        TotalScore: score,
        GamesPlayed: 1, // Will be summed in PlayFab
        EnemiesKilled: gameStatsRef.current.enemiesKilled || 0,
        BossesDefeated: gameStatsRef.current.bossesDefeated || 0,
        WavesCompleted: wave,
        PowerupsCollected: gameStatsRef.current.powerupsCollected || 0,
        PlayTimeSeconds: Math.floor(playTimeRef.current / 1000),
      });
    }

    // 🆕 Save progress to cloud
    if (isConnected) {
      await saveProgress({
        highScore: Math.max(score, highScore),
        gameBeaten: gameBeaten || (wave >= 50),
        highestWave: Math.max(wave, highestWaveReachedRef.current),
        achievements: unlockedAchievements,
        statistics: gameStatsRef.current,
      });
    }
  };

  // ============================================
  // 5. TRACK EVENTS DURING GAMEPLAY
  // ============================================

  // When enemy is killed:
  const handleEnemyDestroyed = (enemy) => {
    // Existing kill logic...

    // 🆕 Track event
    if (isConnected) {
      trackEvent('EnemyKilled', {
        enemyType: enemy.type,
        wave: wave,
        score: score,
        wasCombo: gameStatsRef.current.comboMultiplier > 1,
      });
    }
  };

  // When boss defeated:
  const handleBossDefeated = (bossName) => {
    // Existing boss logic...

    // 🆕 Track event
    if (isConnected) {
      trackEvent('BossDefeated', {
        bossName: bossName,
        wave: wave,
        timeTaken: bossKillTime,
        healthRemaining: playerRef.current.health,
      });
    }
  };

  // When powerup collected:
  const handlePowerupCollected = (powerup) => {
    // Existing powerup logic...

    // 🆕 Track event
    if (isConnected) {
      trackEvent('PowerupCollected', {
        powerupType: powerup.type,
        wave: wave,
        score: score,
      });
    }
  };

  // When achievement unlocked:
  const handleAchievementUnlocked = (achievement) => {
    // Existing achievement logic...
    setUnlockedAchievements(prev => [...prev, achievement.id]);

    // 🆕 Track achievement in PlayFab
    if (isConnected) {
      trackEvent('AchievementUnlocked', {
        achievementId: achievement.id,
        achievementName: achievement.name,
        category: achievement.category,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // ============================================
  // 6. ADD LEADERBOARD BUTTON TO MENU
  // ============================================

  // In your menu render, add a leaderboard button:

  const renderMainMenu = () => {
    return (
      <div style={{ /* your menu styles */ }}>
        <button onClick={startGame}>Play</button>
        <button onClick={() => setShowSettings(true)}>Settings</button>

        {/* 🆕 Leaderboard button */}
        <button
          onClick={() => setShowLeaderboard(true)}
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ff8800)',
            /* ... other styles */
          }}
        >
          🏆 Leaderboard
        </button>

        <button onClick={quitGame}>Quit</button>
      </div>
    );
  };

  // ============================================
  // 7. ADD COMPONENTS TO RENDER
  // ============================================

  return (
    <div className="space-shooter">
      {/* 🆕 PlayFab connection status (top-right corner) */}
      <PlayFabStatus />

      {/* Your existing game canvas */}
      <canvas ref={canvasRef} />

      {/* Your existing UI */}
      {gameState === 'menu' && renderMainMenu()}
      {gameState === 'playing' && renderGameUI()}

      {/* 🆕 Leaderboard modal */}
      {showLeaderboard && (
        <Leaderboard
          gameMode={gameMode}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
};

// ============================================
// 8. OPTIONAL: AUTO-SAVE PROGRESS PERIODICALLY
// ============================================

useEffect(() => {
  if (!isConnected || gameState !== 'playing') return;

  // Auto-save every 30 seconds
  const saveInterval = setInterval(() => {
    saveProgress({
      highScore,
      gameBeaten,
      highestWave: Math.max(wave, highestWaveReachedRef.current),
      achievements: unlockedAchievements,
      statistics: gameStatsRef.current,
    });
    console.log('✅ Auto-save: Progress synced to cloud');
  }, 30000);

  return () => clearInterval(saveInterval);
}, [isConnected, gameState, highScore, wave, unlockedAchievements]);

// ============================================
// 9. OPTIONAL: SHOW LEADERBOARD AFTER GAME OVER
// ============================================

useEffect(() => {
  if (gameState === 'gameOver' && score > 0) {
    // Show leaderboard after 3 seconds
    const timer = setTimeout(() => {
      setShowLeaderboard(true);
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [gameState, score]);

// ============================================
// SUMMARY OF CHANGES
// ============================================

/*
What was added:
1. ✅ usePlayFab hook for cloud integration
2. ✅ Auto-sync with cloud on game start (merges local + cloud data)
3. ✅ Submit high scores to leaderboard on game over
4. ✅ Track player statistics (kills, bosses, playtime, etc.)
5. ✅ Save progress to cloud (achievements, waves, etc.)
6. ✅ Track game events for analytics (kills, powerups, bosses)
7. ✅ Leaderboard UI component with modal
8. ✅ PlayFab connection status indicator
9. ✅ Auto-save progress every 30 seconds
10. ✅ Show leaderboard after game over

Benefits:
- 🏆 Global leaderboards - compete with players worldwide
- ☁️ Cloud saves - progress syncs across devices
- 📊 Analytics - track player behavior and optimize game
- 🎖️ Achievements - sync unlocks to the cloud
- 🔄 Cross-device - play on PC, continue on mobile
- 📈 Insights - see how players interact with your game

No changes needed to your existing game logic!
All features work offline - sync happens automatically when online.
*/

export default SpaceShooter;
