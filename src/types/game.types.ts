/**
 * TypeScript Type Definitions for Nebula X
 * Provides type safety and IDE autocomplete for game entities
 */

// ============================================
// GAME STATE TYPES
// ============================================

export type GameState =
  | 'brand'
  | 'cinematic'
  | 'splash'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'gameOver'
  | 'checkpoint'
  | 'victory';

export type GameMode =
  | 'campaign'
  | 'survival'
  | 'bossRush'
  | 'timeAttack'
  | 'practice';

export type SettingsTab = 'audio' | 'profile' | 'controls';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type AchievementCategory =
  | 'score'
  | 'kills'
  | 'bosses'
  | 'waves'
  | 'powerups'
  | 'special';

// ============================================
// PLAYER TYPES
// ============================================

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  polarity: 'blue' | 'red';
  invulnerable: boolean;
  invulnerableTime: number;
  weaponLevel: number;
  fireRate: number;
  lastShot: number;
  autoFire: boolean;
  autoFireTime: number;
  doubleScore: boolean;
  doubleScoreTime: number;
  rapidFire: boolean;
  rapidFireTime: number;
}

export interface PlayerStats {
  score: number;
  highScore: number;
  enemiesKilled: number;
  bossesDefeated: number;
  wavesCompleted: number;
  powerupsCollected: number;
  bulletsShot: number;
  damageDealt: number;
  damageTaken: number;
  playTime: number;
  comboMultiplier: number;
  maxCombo: number;
}

// ============================================
// ENEMY TYPES
// ============================================

export type EnemyType =
  | 'fighter'
  | 'bomber'
  | 'kamikaze'
  | 'sniper'
  | 'tank'
  | 'boss'
  | 'miniboss';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  polarity: 'blue' | 'red';
  points: number;
  behavior: string;
  phase: number;
  lastShot: number;
  fireRate: number;
  dead: boolean;
  deathTime: number;
  pattern?: string;
  isBoss?: boolean;
}

// ============================================
// BULLET TYPES
// ============================================

export interface Bullet {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  damage: number;
  polarity: 'blue' | 'red';
  fromPlayer: boolean;
  pattern?: string;
}

// ============================================
// POWERUP TYPES
// ============================================

export type PowerupType =
  | 'HEALTH'
  | 'SHIELD'
  | 'WEAPON_UP'
  | 'RAPID_FIRE'
  | 'SPREAD_SHOT'
  | 'LASER'
  | 'MISSILE'
  | 'BOMB'
  | 'SCORE_BONUS'
  | 'DOUBLE_SCORE'
  | 'EXTRA_LIFE'
  | 'INVINCIBILITY'
  | 'POLARITY_SWITCH';

export interface Powerup {
  id: string;
  type: PowerupType;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  icon: string;
  color: string;
  rarity: Rarity;
  glowColor: string;
  description: string;
}

export interface PowerupInfo {
  color: string;
  icon: string;
  name: string;
  rarity: Rarity;
  glowColor: string;
  description: string;
}

// ============================================
// PARTICLE TYPES
// ============================================

export interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
  type?: 'spark' | 'smoke' | 'glow';
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

// ============================================
// ACHIEVEMENT TYPES
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: number;
  type: 'score' | 'kills' | 'boss' | 'wave' | 'powerup' | 'special';
  secret?: boolean;
}

export interface AchievementNotification {
  achievement: Achievement;
  timestamp: number;
  displayed: boolean;
}

// ============================================
// RANK TYPES
// ============================================

export interface Rank {
  title: string;
  color: string;
  icon: string;
}

// ============================================
// CONTROL TYPES
// ============================================

export interface ControlMapping {
  key1: string;
  key2: string;
  gamepad?: number;
}

export interface Controls {
  moveUp: ControlMapping;
  moveDown: ControlMapping;
  moveLeft: ControlMapping;
  moveRight: ControlMapping;
  shoot: ControlMapping;
  bomb: ControlMapping;
  pause: ControlMapping;
  polaritySwitch: ControlMapping;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  screenShake: boolean;
  particles: boolean;
  showFPS: boolean;
  showHitboxes: boolean;
  controls: Controls;
}

// ============================================
// PRACTICE MODE TYPES
// ============================================

export interface PracticeSettings {
  startWave: number;
  infiniteLives: boolean;
  invincible: boolean;
  maxPower: boolean;
  slowBullets: boolean;
  showHitboxes: boolean;
}

// ============================================
// ZONE TYPES
// ============================================

export type Zone = 'nebula' | 'asteroid' | 'ice' | 'lava' | 'void';

export interface ZoneInfo {
  name: string;
  color: string;
  bgColor: string;
  startWave: number;
  endWave: number;
}

// ============================================
// CLOUD SAVE TYPES
// ============================================

export interface CloudSaveData {
  highScore: number;
  gameBeaten: boolean;
  highestWave: number;
  achievements: string[];
  statistics: Partial<PlayerStats>;
  lastSaved: string;
}

// ============================================
// LEADERBOARD TYPES
// ============================================

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
}

export interface PlayerRank {
  rank: number;
  score: number;
}

// ============================================
// PLAYFAB TYPES
// ============================================

export interface PlayFabResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface PlayFabLoginResult extends PlayFabResult {
  playerId?: string;
}

export interface PlayFabLeaderboardResult extends PlayFabResult {
  leaderboard: LeaderboardEntry[];
}

export interface PlayFabRankResult extends PlayFabResult {
  rank?: number;
  score?: number;
}

export interface PlayFabCloudData extends PlayFabResult {
  data: Record<string, any>;
}

// ============================================
// EVENT TYPES (for Analytics)
// ============================================

export interface GameEvent {
  name: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface GameMetrics {
  fps: number;
  frameTime: number;
  enemyCount: number;
  bulletCount: number;
  particleCount: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type Vector2D = {
  x: number;
  y: number;
};

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Color = string;

export type Timestamp = number;

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface LeaderboardProps {
  gameMode: GameMode;
  onClose: () => void;
}

export interface PlayFabStatusProps {
  onLogin?: (result: PlayFabLoginResult) => void;
  showLoginPrompt?: boolean;
}

export interface InstallPromptProps {
  // No props needed
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UsePlayFabReturn {
  isConnected: boolean;
  isInitializing: boolean;
  isConfigured: boolean;
  playerId: string | null;
  displayName: string | null;
  playerData: CloudSaveData | null;

  submitScore: (score: number, gameMode?: GameMode) => Promise<PlayFabResult>;
  trackEvent: (eventName: string, eventData?: Record<string, any>) => Promise<PlayFabResult>;
  updateStats: (stats: Record<string, number>) => Promise<PlayFabResult>;
  saveProgress: (progressData: Partial<CloudSaveData>) => Promise<PlayFabResult>;
  loadProgress: () => Promise<PlayFabCloudData>;
  syncWithCloud: (localData: Partial<CloudSaveData>) => Promise<{ success: boolean; mergedData: CloudSaveData }>;

  getLeaderboard: (gameMode?: GameMode, maxResults?: number) => Promise<PlayFabLeaderboardResult>;
  getPlayerRank: (gameMode?: GameMode) => Promise<PlayFabRankResult>;

  setDisplayName: (name: string) => Promise<PlayFabResult>;
  unlockAchievement: (achievementId: string, achievementName: string) => Promise<PlayFabResult>;
}

export interface UseAppInsightsReturn {
  isConfigured: boolean;
  trackEvent: (name: string, properties?: Record<string, any>) => void;
  trackPageView: (name: string, uri?: string) => void;
  trackException: (error: Error, severityLevel?: number) => void;
  trackMetric: (name: string, value: number) => void;
  trackGameStart: (gameMode: string, difficulty?: string) => void;
  trackGameEnd: (data: {
    gameMode: string;
    score: number;
    wave: number;
    playTime: number;
    enemiesKilled: number;
    bossesDefeated: number;
  }) => void;
}

// ============================================
// EXPORT ALL TYPES
// ============================================

export type {
  // Export all types for external use
};
