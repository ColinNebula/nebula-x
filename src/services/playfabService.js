/**
 * PlayFab Service - Azure Gaming Backend Integration
 * Handles authentication, leaderboards, achievements, cloud saves, and analytics
 */

import PlayFab from 'playfab-sdk';
import PlayFabConfig from './playfabConfig';

class PlayFabService {
  constructor() {
    this.isInitialized = false;
    this.isLoggedIn = false;
    this.playerId = null;
    this.displayName = null;
    this.offlineQueue = [];

    // Initialize PlayFab
    this.initialize();
  }

  /**
   * Initialize PlayFab SDK
   */
  initialize() {
    if (this.isInitialized) return;

    try {
      PlayFab.settings.titleId = PlayFabConfig.titleId;
      this.isInitialized = true;
      console.log('✅ PlayFab initialized with Title ID:', PlayFabConfig.titleId);
    } catch (error) {
      console.error('❌ PlayFab initialization failed:', error);
    }
  }

  /**
   * Login anonymously (no password required - easy for players)
   * Generates a unique device ID for the player
   */
  async loginAnonymously() {
    if (!this.isInitialized) {
      console.error('PlayFab not initialized');
      return { success: false, error: 'Not initialized' };
    }

    return new Promise((resolve) => {
      // Get or create device ID
      let customId = localStorage.getItem('playfab_device_id');
      if (!customId) {
        customId = this.generateDeviceId();
        localStorage.setItem('playfab_device_id', customId);
      }

      const request = {
        CustomId: customId,
        CreateAccount: true, // Auto-create account if doesn't exist
        TitleId: PlayFabConfig.titleId,
      };

      PlayFab.ClientApi.LoginWithCustomID(request, (result, error) => {
        if (result) {
          this.isLoggedIn = true;
          this.playerId = result.data.PlayFabId;
          this.displayName = result.data.InfoResultPayload?.AccountInfo?.TitleInfo?.DisplayName || 'Player';

          console.log('✅ PlayFab login successful:', this.playerId);

          // Load player data
          this.loadCloudSave();

          resolve({ success: true, playerId: this.playerId });
        } else {
          console.error('❌ PlayFab login failed:', error);
          resolve({ success: false, error: error.errorMessage });
        }
      });
    });
  }

  /**
   * Generate unique device ID
   */
  generateDeviceId() {
    return 'device_' + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Set player display name
   */
  async setDisplayName(name) {
    if (!this.isLoggedIn) return { success: false };

    return new Promise((resolve) => {
      const request = { DisplayName: name };

      PlayFab.ClientApi.UpdateUserTitleDisplayName(request, (result, error) => {
        if (result) {
          this.displayName = name;
          console.log('✅ Display name updated:', name);
          resolve({ success: true });
        } else {
          console.error('❌ Display name update failed:', error);
          resolve({ success: false, error: error.errorMessage });
        }
      });
    });
  }

  /**
   * Submit score to leaderboard
   */
  async submitScore(score, gameMode = 'campaign') {
    if (!this.isLoggedIn) {
      console.log('Not logged in, score saved locally only');
      return { success: false };
    }

    // Get leaderboard name based on game mode
    const leaderboardName = this.getLeaderboardName(gameMode);

    return new Promise((resolve) => {
      const request = {
        Statistics: [
          { StatisticName: leaderboardName, Value: score },
          { StatisticName: PlayFabConfig.statistics.highScore, Value: score },
        ],
      };

      PlayFab.ClientApi.UpdatePlayerStatistics(request, (result, error) => {
        if (result) {
          console.log('✅ Score submitted to leaderboard:', score);
          resolve({ success: true });
        } else {
          console.error('❌ Score submission failed:', error);
          resolve({ success: false, error: error.errorMessage });
        }
      });
    });
  }

  /**
   * Get leaderboard (top scores)
   */
  async getLeaderboard(gameMode = 'campaign', maxResults = 100) {
    if (!this.isLoggedIn) return { success: false, leaderboard: [] };

    const leaderboardName = this.getLeaderboardName(gameMode);

    return new Promise((resolve) => {
      const request = {
        StatisticName: leaderboardName,
        StartPosition: 0,
        MaxResultsCount: maxResults,
      };

      PlayFab.ClientApi.GetLeaderboard(request, (result, error) => {
        if (result) {
          const leaderboard = result.data.Leaderboard.map((entry, index) => ({
            rank: index + 1,
            playerId: entry.PlayFabId,
            displayName: entry.DisplayName || 'Anonymous',
            score: entry.StatValue,
          }));

          console.log('✅ Leaderboard loaded:', leaderboard.length, 'entries');
          resolve({ success: true, leaderboard });
        } else {
          console.error('❌ Leaderboard load failed:', error);
          resolve({ success: false, leaderboard: [] });
        }
      });
    });
  }

  /**
   * Get player's rank on leaderboard
   */
  async getPlayerRank(gameMode = 'campaign') {
    if (!this.isLoggedIn) return { success: false };

    const leaderboardName = this.getLeaderboardName(gameMode);

    return new Promise((resolve) => {
      const request = {
        StatisticName: leaderboardName,
        StartPosition: 0,
        MaxResultsCount: 10,
      };

      PlayFab.ClientApi.GetLeaderboardAroundPlayer(request, (result, error) => {
        if (result) {
          const playerEntry = result.data.Leaderboard.find(
            entry => entry.PlayFabId === this.playerId
          );

          if (playerEntry) {
            console.log('✅ Player rank:', playerEntry.Position + 1);
            resolve({
              success: true,
              rank: playerEntry.Position + 1,
              score: playerEntry.StatValue,
            });
          } else {
            resolve({ success: false });
          }
        } else {
          console.error('❌ Player rank load failed:', error);
          resolve({ success: false });
        }
      });
    });
  }

  /**
   * Update player statistics
   */
  async updateStatistics(stats) {
    if (!this.isLoggedIn) return { success: false };

    return new Promise((resolve) => {
      const statistics = Object.entries(stats).map(([key, value]) => ({
        StatisticName: key,
        Value: value,
      }));

      const request = { Statistics: statistics };

      PlayFab.ClientApi.UpdatePlayerStatistics(request, (result, error) => {
        if (result) {
          console.log('✅ Statistics updated:', Object.keys(stats));
          resolve({ success: true });
        } else {
          console.error('❌ Statistics update failed:', error);
          resolve({ success: false, error: error.errorMessage });
        }
      });
    });
  }

  /**
   * Get player statistics
   */
  async getStatistics() {
    if (!this.isLoggedIn) return { success: false, statistics: {} };

    return new Promise((resolve) => {
      PlayFab.ClientApi.GetPlayerStatistics({}, (result, error) => {
        if (result) {
          const statistics = {};
          result.data.Statistics.forEach(stat => {
            statistics[stat.StatisticName] = stat.Value;
          });

          console.log('✅ Statistics loaded:', Object.keys(statistics).length);
          resolve({ success: true, statistics });
        } else {
          console.error('❌ Statistics load failed:', error);
          resolve({ success: false, statistics: {} });
        }
      });
    });
  }

  /**
   * Save data to cloud
   */
  async saveToCloud(key, data) {
    if (!this.isLoggedIn) return { success: false };

    return new Promise((resolve) => {
      const request = {
        Data: {
          [key]: JSON.stringify(data),
        },
      };

      PlayFab.ClientApi.UpdateUserData(request, (result, error) => {
        if (result) {
          console.log('✅ Cloud save successful:', key);
          resolve({ success: true });
        } else {
          console.error('❌ Cloud save failed:', error);
          resolve({ success: false, error: error.errorMessage });
        }
      });
    });
  }

  /**
   * Load data from cloud
   */
  async loadFromCloud(keys) {
    if (!this.isLoggedIn) return { success: false, data: {} };

    return new Promise((resolve) => {
      const request = {
        Keys: Array.isArray(keys) ? keys : [keys],
      };

      PlayFab.ClientApi.GetUserData(request, (result, error) => {
        if (result) {
          const data = {};
          Object.entries(result.data.Data || {}).forEach(([key, value]) => {
            try {
              data[key] = JSON.parse(value.Value);
            } catch (e) {
              data[key] = value.Value;
            }
          });

          console.log('✅ Cloud data loaded:', Object.keys(data));
          resolve({ success: true, data });
        } else {
          console.error('❌ Cloud data load failed:', error);
          resolve({ success: false, data: {} });
        }
      });
    });
  }

  /**
   * Save all game progress to cloud
   */
  async saveGameProgress(progressData) {
    const saveData = {
      highScore: progressData.highScore || 0,
      gameBeaten: progressData.gameBeaten || false,
      highestWave: progressData.highestWave || 1,
      achievements: progressData.achievements || [],
      statistics: progressData.statistics || {},
      lastSaved: new Date().toISOString(),
    };

    return this.saveToCloud(PlayFabConfig.cloudSaveKeys.gameProgress, saveData);
  }

  /**
   * Load game progress from cloud
   */
  async loadCloudSave() {
    const result = await this.loadFromCloud([
      PlayFabConfig.cloudSaveKeys.gameProgress,
      PlayFabConfig.cloudSaveKeys.achievements,
    ]);

    if (result.success) {
      return result.data[PlayFabConfig.cloudSaveKeys.gameProgress] || {};
    }
    return {};
  }

  /**
   * Track custom event (analytics)
   */
  async trackEvent(eventName, eventData = {}) {
    if (!this.isLoggedIn || !PlayFabConfig.features.enableAnalytics) {
      return { success: false };
    }

    return new Promise((resolve) => {
      const request = {
        EventName: eventName,
        Body: eventData,
      };

      PlayFab.ClientApi.WritePlayerEvent(request, (result, error) => {
        if (result) {
          console.log('✅ Event tracked:', eventName);
          resolve({ success: true });
        } else {
          console.error('❌ Event tracking failed:', error);
          resolve({ success: false });
        }
      });
    });
  }

  /**
   * Helper: Get leaderboard name for game mode
   */
  getLeaderboardName(gameMode) {
    switch (gameMode) {
      case 'survival': return PlayFabConfig.leaderboards.survivalScore;
      case 'bossRush': return PlayFabConfig.leaderboards.bossRushScore;
      case 'timeAttack': return PlayFabConfig.leaderboards.timeAttackScore;
      default: return PlayFabConfig.leaderboards.highScore;
    }
  }

  /**
   * Check if PlayFab is properly configured
   */
  isConfigured() {
    return this.isInitialized &&
           PlayFabConfig.titleId !== 'YOUR_TITLE_ID_HERE' &&
           PlayFabConfig.titleId.length > 0;
  }
}

// Export singleton instance
const playfabService = new PlayFabService();
export default playfabService;
