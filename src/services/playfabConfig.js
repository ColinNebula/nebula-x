/**
 * PlayFab Configuration
 * Get your Title ID from: https://developer.playfab.com/
 *
 * Steps to set up:
 * 1. Create free account at https://developer.playfab.com/
 * 2. Create a new title (game)
 * 3. Copy your Title ID from Settings > API Features
 * 4. Replace 'YOUR_TITLE_ID_HERE' below
 */

const PlayFabConfig = {
  // Your PlayFab Title ID (get this from PlayFab dashboard)
  titleId: process.env.REACT_APP_PLAYFAB_TITLE_ID || 'YOUR_TITLE_ID_HERE',

  // Leaderboard names
  leaderboards: {
    highScore: 'HighScores',
    survivalScore: 'SurvivalMode',
    bossRushScore: 'BossRushMode',
    timeAttackScore: 'TimeAttackMode',
  },

  // Achievement/Statistic names (must match PlayFab dashboard)
  statistics: {
    totalScore: 'TotalScore',
    highScore: 'HighScore',
    gamesPlayed: 'GamesPlayed',
    enemiesKilled: 'EnemiesKilled',
    bossesDefeated: 'BossesDefeated',
    wavesCompleted: 'WavesCompleted',
    powerupsCollected: 'PowerupsCollected',
    bulletsShot: 'BulletsShot',
    damageDealt: 'DamageDealt',
    damageTaken: 'DamageTaken',
    playTime: 'PlayTimeSeconds',
  },

  // Cloud save keys
  cloudSaveKeys: {
    gameProgress: 'GameProgress',
    achievements: 'Achievements',
    settings: 'GameSettings',
    customization: 'ShipCustomization',
  },

  // Feature flags
  features: {
    enableLeaderboards: true,
    enableAchievements: true,
    enableCloudSave: true,
    enableAnalytics: true,
    enableOfflineMode: true, // Queue actions when offline
  },
};

export default PlayFabConfig;
