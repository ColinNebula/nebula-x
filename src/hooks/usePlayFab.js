/**
 * Custom React Hook for PlayFab Integration
 * Provides easy-to-use functions for game developers
 */

import { useState, useEffect, useCallback } from 'react';
import playfabService from '../services/playfabService';
import PlayFabConfig from '../services/playfabConfig';

export const usePlayFab = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [playerData, setPlayerData] = useState(null);

  // Initialize PlayFab on mount
  useEffect(() => {
    initializePlayFab();
  }, []);

  const initializePlayFab = async () => {
    if (!playfabService.isConfigured()) {
      console.warn('PlayFab not configured. Skipping initialization.');
      setIsInitializing(false);
      return;
    }

    // Auto-login
    const result = await playfabService.loginAnonymously();
    if (result.success) {
      setIsConnected(true);
      await loadPlayerData();
    }
    setIsInitializing(false);
  };

  const loadPlayerData = async () => {
    const cloudData = await playfabService.loadCloudSave();
    setPlayerData(cloudData);
  };

  /**
   * Submit score to leaderboard
   */
  const submitScore = useCallback(async (score, gameMode = 'campaign') => {
    if (!isConnected) return { success: false, message: 'Not connected' };

    const result = await playfabService.submitScore(score, gameMode);

    if (result.success) {
      // Also update statistics
      await playfabService.updateStatistics({
        [PlayFabConfig.statistics.totalScore]: score,
        [PlayFabConfig.statistics.gamesPlayed]: 1, // Increment
      });
    }

    return result;
  }, [isConnected]);

  /**
   * Track game event (e.g., enemy killed, powerup collected)
   */
  const trackEvent = useCallback(async (eventName, eventData = {}) => {
    if (!isConnected) return { success: false };
    return playfabService.trackEvent(eventName, eventData);
  }, [isConnected]);

  /**
   * Update player statistics
   */
  const updateStats = useCallback(async (stats) => {
    if (!isConnected) return { success: false };
    return playfabService.updateStatistics(stats);
  }, [isConnected]);

  /**
   * Save game progress to cloud
   */
  const saveProgress = useCallback(async (progressData) => {
    if (!isConnected) return { success: false };

    const result = await playfabService.saveGameProgress(progressData);

    if (result.success) {
      setPlayerData(progressData);
    }

    return result;
  }, [isConnected]);

  /**
   * Load game progress from cloud
   */
  const loadProgress = useCallback(async () => {
    if (!isConnected) return { success: false, data: null };

    const cloudData = await playfabService.loadCloudSave();
    setPlayerData(cloudData);

    return { success: true, data: cloudData };
  }, [isConnected]);

  /**
   * Get leaderboard
   */
  const getLeaderboard = useCallback(async (gameMode = 'campaign', maxResults = 100) => {
    if (!isConnected) return { success: false, leaderboard: [] };
    return playfabService.getLeaderboard(gameMode, maxResults);
  }, [isConnected]);

  /**
   * Get player rank
   */
  const getPlayerRank = useCallback(async (gameMode = 'campaign') => {
    if (!isConnected) return { success: false };
    return playfabService.getPlayerRank(gameMode);
  }, [isConnected]);

  /**
   * Set player display name
   */
  const setDisplayName = useCallback(async (name) => {
    if (!isConnected) return { success: false };
    return playfabService.setDisplayName(name);
  }, [isConnected]);

  /**
   * Track achievement unlock
   */
  const unlockAchievement = useCallback(async (achievementId, achievementName) => {
    if (!isConnected) return { success: false };

    // Track as event
    await playfabService.trackEvent('AchievementUnlocked', {
      achievementId,
      achievementName,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }, [isConnected]);

  /**
   * Sync local data with cloud
   * Merges local and cloud progress, keeping the best of both
   */
  const syncWithCloud = useCallback(async (localData) => {
    if (!isConnected) return { success: false, mergedData: localData };

    const cloudData = await playfabService.loadCloudSave();

    // Merge strategy: keep highest scores, combine achievements
    const mergedData = {
      highScore: Math.max(localData.highScore || 0, cloudData.highScore || 0),
      gameBeaten: localData.gameBeaten || cloudData.gameBeaten,
      highestWave: Math.max(localData.highestWave || 1, cloudData.highestWave || 1),
      achievements: [...new Set([
        ...(localData.achievements || []),
        ...(cloudData.achievements || [])
      ])],
      statistics: {
        ...cloudData.statistics,
        ...localData.statistics,
        // Combine certain stats
        enemiesKilled: (cloudData.statistics?.enemiesKilled || 0) +
                       (localData.statistics?.enemiesKilled || 0),
        powerupsCollected: (cloudData.statistics?.powerupsCollected || 0) +
                          (localData.statistics?.powerupsCollected || 0),
      },
    };

    // Save merged data back to cloud
    await playfabService.saveGameProgress(mergedData);
    setPlayerData(mergedData);

    return { success: true, mergedData };
  }, [isConnected]);

  return {
    // Connection state
    isConnected,
    isInitializing,
    isConfigured: playfabService.isConfigured(),

    // Player info
    playerId: playfabService.playerId,
    displayName: playfabService.displayName,
    playerData,

    // Core functions
    submitScore,
    trackEvent,
    updateStats,
    saveProgress,
    loadProgress,
    syncWithCloud,

    // Leaderboards
    getLeaderboard,
    getPlayerRank,

    // Profile
    setDisplayName,

    // Achievements
    unlockAchievement,
  };
};

export default usePlayFab;
