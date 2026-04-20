# TypeScript Integration & Application Insights Setup Guide

Complete guide to adding TypeScript type safety and Azure Application Insights monitoring to Nebula X.

---

## 🎯 What Was Added

### TypeScript (Type Safety)
- ✅ Full TypeScript support with tsconfig.json
- ✅ Type definitions for all game entities (250+ types)
- ✅ Better IDE autocomplete and IntelliSense
- ✅ Catch bugs before runtime
- ✅ Improved code maintainability
- ✅ Gradual migration support (JS + TS side-by-side)

### Application Insights (Monitoring)
- ✅ Real-time analytics and error tracking
- ✅ Player behavior monitoring
- ✅ Performance metrics (FPS, frame time)
- ✅ Exception tracking with stack traces
- ✅ Custom event logging
- ✅ Azure dashboard integration

---

## ⚡ TypeScript Setup (Already Done!)

### Files Created

```
TypeScript Configuration:
├── tsconfig.json              - Main TS config
├── tsconfig.node.json         - Node.js config
└── src/types/
    └── game.types.ts          - 250+ game type definitions

Monitoring:
├── src/services/
│   ├── appInsightsConfig.ts   - App Insights configuration
│   └── appInsightsService.ts  - Monitoring service (350+ lines)
├── src/hooks/
│   └── useAppInsights.ts      - React hook for analytics
└── src/components/
    └── ErrorBoundary.tsx      - Global error handler
```

### TypeScript Features

#### 1. Type-Safe Game Entities

```typescript
import type { Player, Enemy, Powerup, GameState } from '@types/game.types';

// Type-safe player object
const player: Player = {
  x: 400,
  y: 500,
  width: 32,
  height: 32,
  speed: 5,
  health: 100,
  maxHealth: 100,
  // ... TypeScript ensures all properties are present!
};

// Type-safe game state
const [gameState, setGameState] = useState<GameState>('menu');
// Only allows: 'brand', 'menu', 'playing', etc.
```

#### 2. IDE Autocomplete

```typescript
// VS Code will suggest all available properties!
enemy.health = 100;    // ✅ Autocomplete works
enemy.shield = 50;     // ❌ Property doesn't exist - caught at dev time!
```

#### 3. Function Type Safety

```typescript
import type { GameMode, CloudSaveData } from '@types/game.types';

// Function parameters are type-checked
function submitScore(score: number, gameMode: GameMode): Promise<void> {
  // TypeScript ensures 'gameMode' is valid
  if (gameMode === 'campaign') { // ✅ Valid
    // ...
  }
}

submitScore(1000, 'invalid'); // ❌ Error: "invalid" is not a valid GameMode
```

---

## 🔧 Application Insights Setup

### Step 1: Create Application Insights Resource (5 minutes)

1. Go to **https://portal.azure.com/**
2. Click **"Create a resource"**
3. Search for **"Application Insights"**
4. Click **"Create"**

**Configuration:**
- **Resource name**: `nebula-x-insights`
- **Region**: Choose closest to your players
- **Resource Group**: Create new or use existing
- **Mode**: **Classic** (simpler for games)

5. Click **"Review + Create"** → **"Create"**

### Step 2: Get Instrumentation Key (1 minute)

1. Go to your Application Insights resource
2. Click **"Overview"** in left menu
3. Copy the **"Instrumentation Key"** (UUID format)
   - Example: `12345678-1234-1234-1234-123456789012`

### Step 3: Configure Nebula X (1 minute)

Add to your `.env` file:

```bash
REACT_APP_APPINSIGHTS_KEY=12345678-1234-1234-1234-123456789012
```

**Or** edit `src/services/appInsightsConfig.ts`:

```typescript
instrumentationKey: '12345678-1234-1234-1234-123456789012',
```

### Step 4: Test It! (1 minute)

```bash
npm start
```

Check console for:
```
✅ Application Insights initialized
```

Play a game and check Azure Portal → Application Insights → **Live Metrics**

---

## 📊 What Application Insights Tracks

### Automatic Tracking

✅ **Page Views** - When menu/game screens load  
✅ **Exceptions** - All JavaScript errors with stack traces  
✅ **Dependencies** - API calls, resource loading  
✅ **Performance** - Page load time, render time  
✅ **User Sessions** - Session duration, user flow

### Game-Specific Tracking (Already Implemented!)

```typescript
import { useAppInsights } from '@hooks/useAppInsights';

const { trackEvent, trackGameStart, trackGameEnd } = useAppInsights();

// Track game session
trackGameStart('campaign', 'normal');

// Track custom events
trackEvent('EnemyKilled', {
  enemyType: 'fighter',
  wave: 5,
  score: 1250,
});

// Track game completion
trackGameEnd({
  gameMode: 'campaign',
  score: 50000,
  wave: 25,
  playTime: 1800,
  enemiesKilled: 542,
  bossesDefeated: 5,
});
```

### Custom Metrics Already Tracked

| Metric | Description | Usage |
|--------|-------------|-------|
| `GameStart` | Player starts a game | Engagement metric |
| `GameEnd` | Player finishes/quits | Session analysis |
| `PlayerDeath` | Player dies | Difficulty tuning |
| `BossDefeated` | Boss is defeated | Boss difficulty |
| `AchievementUnlocked` | Achievement earned | Player progression |
| `PowerupCollected` | Powerup picked up | Balance analysis |
| `GameFPS` | Frames per second | Performance monitoring |

---

## 🎮 Integration Examples

### Basic Integration (Already Works!)

The services auto-initialize. Just use the hooks:

```typescript
import { useAppInsights } from '@hooks/useAppInsights';
import type { GameMode } from '@types/game.types';

const SpaceShooter = () => {
  const { trackEvent, trackGameStart, trackGameEnd } = useAppInsights();

  const handleGameStart = () => {
    trackGameStart(gameMode, difficulty);
  };

  const handleEnemyKilled = (enemyType: string) => {
    trackEvent('EnemyKilled', { enemyType, wave, score });
  };

  const handleGameOver = () => {
    trackGameEnd({
      gameMode,
      score,
      wave,
      playTime: playTimeInSeconds,
      enemiesKilled,
      bossesDefeated,
    });
  };

  // ... rest of component
};
```

### Error Tracking (Automatic!)

Wrap your app in ErrorBoundary:

```typescript
import ErrorBoundary from '@components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <SpaceShooter />
    </ErrorBoundary>
  );
}
```

All React errors are automatically reported to Azure!

### Performance Tracking

```typescript
// Track FPS
const fps = calculateFPS();
trackMetric('GameFPS', fps);

// Track custom performance
const renderTime = performance.now() - startTime;
trackMetric('RenderTime', renderTime);
```

---

## 📊 Azure Dashboard Features

### 1. Live Metrics Stream

**Application Insights → Live Metrics**

Real-time view of:
- Active users playing right now
- Requests per second
- Failed requests
- Server response time
- Memory/CPU usage

### 2. Analytics (Custom Queries)

**Application Insights → Logs**

Query your data with KQL (Kusto Query Language):

```kusto
// Top 10 players by score
customEvents
| where name == "GameEnd"
| project score = todouble(customMeasurements.score)
| top 10 by score desc

// Average wave reached
customEvents
| where name == "GameEnd"
| summarize avgWave = avg(toint(customDimensions.wave))

// Most common death wave
customEvents
| where name == "PlayerDeath"
| summarize count() by wave = customDimensions.wave
| order by count_ desc

// FPS over time
customMetrics
| where name == "GameFPS"
| summarize avg(value) by bin(timestamp, 5m)
| render timechart
```

### 3. Application Map

**Application Insights → Application Map**

Visual dependency map:
- See all API calls
- Track response times
- Identify slow endpoints

### 4. Failures

**Application Insights → Failures**

- Top exceptions
- Exception stack traces
- Affected user count
- Failure trends

### 5. Performance

**Application Insights → Performance**

- Slowest operations
- Performance by operation
- Dependency performance

### 6. Users & Sessions

**Application Insights → Users**

- Daily active users
- Session duration
- User retention
- Geographic distribution

---

## 🎯 Recommended Dashboards

### Create Custom Dashboard in Azure

1. **Player Engagement**
   - Daily/weekly active users
   - Average session duration
   - Games played per user
   - Retention rate

2. **Game Balance**
   - Wave difficulty curve (death rates per wave)
   - Boss defeat rates
   - Powerup usage distribution
   - Average score by game mode

3. **Performance**
   - Average FPS
   - Frame time distribution
   - Resource load times
   - Browser compatibility

4. **Errors & Stability**
   - Exception rate
   - Top errors
   - Error-free session percentage
   - Crash analytics

---

## 💻 TypeScript Migration Guide

### Gradual Migration Strategy

You can mix JS and TS! Migrate files gradually:

#### Step 1: Rename File Extensions

```bash
# From:
src/components/Leaderboard.jsx

# To:
src/components/Leaderboard.tsx
```

#### Step 2: Add Type Imports

```typescript
import type { GameMode, LeaderboardEntry } from '@types/game.types';
```

#### Step 3: Add Type Annotations

```typescript
// Before (JS)
const [score, setScore] = useState(0);
const [gameMode, setGameMode] = useState('campaign');

// After (TS)
const [score, setScore] = useState<number>(0);
const [gameMode, setGameMode] = useState<GameMode>('campaign');
```

#### Step 4: Type Component Props

```typescript
// Before (JS)
const Leaderboard = ({ gameMode, onClose }) => { ... };

// After (TS)
import type { LeaderboardProps } from '@types/game.types';

const Leaderboard: React.FC<LeaderboardProps> = ({ gameMode, onClose }) => {
  // TypeScript will error if props don't match!
};
```

### Files to Migrate First (Recommended Order)

1. **Type definitions** - ✅ Already done! (`game.types.ts`)
2. **Services** - Convert `playfabService.js` → `.ts`
3. **Hooks** - Convert `usePlayFab.js` → `.ts`
4. **Components** - Start with small components
5. **Main game** - `SpaceShooter.jsx` last (largest file)

---

## 🐛 Troubleshooting

### TypeScript Errors

**Error: "Cannot find module '@types/game.types'"**
```bash
# Fix: Update tsconfig.json paths
"paths": {
  "@types/*": ["src/types/*"]
}
```

**Error: "Type 'string' is not assignable to type 'GameMode'"**
```typescript
// Fix: Use type assertion
const mode = 'campaign' as GameMode;

// Or: Define with type
const mode: GameMode = 'campaign';
```

### Application Insights Issues

**"Application Insights not configured"**
- Check `.env` file exists in project root
- Verify `REACT_APP_APPINSIGHTS_KEY` is set
- Restart dev server: `npm start`

**No data showing in Azure Portal**
- Wait 1-2 minutes for initial data
- Check "Live Metrics" for real-time data
- Verify instrumentation key is correct
- Check browser console for errors

**CORS errors**
- Application Insights handles CORS automatically
- If issues persist, check firewall settings

---

## 💰 Cost (FREE Tier!)

**Application Insights Free Tier:**
- ✅ 5 GB data ingestion/month
- ✅ 90 days data retention
- ✅ All features unlocked
- ✅ No credit card required

**Typical Usage:**
- Small game (1000 DAU): ~100 MB/month ✅ FREE
- Medium game (10K DAU): ~1 GB/month ✅ FREE
- Large game (50K DAU): ~4 GB/month ✅ FREE

---

## 📈 Best Practices

### 1. Event Naming Convention

```typescript
// ✅ Good: Descriptive, consistent
trackEvent('Game_Started', { mode: 'campaign' });
trackEvent('Enemy_Killed', { type: 'fighter' });
trackEvent('Boss_Defeated', { name: 'Destroyer' });

// ❌ Bad: Vague, inconsistent
trackEvent('start', {});
trackEvent('kill', {});
```

### 2. Add Context to Events

```typescript
// ✅ Good: Rich context
trackEvent('PlayerDeath', {
  wave: 15,
  enemyType: 'kamikaze',
  healthRemaining: 0,
  shieldActive: false,
  weaponLevel: 3,
});

// ❌ Bad: Limited context
trackEvent('PlayerDeath', {});
```

### 3. Batch Performance Metrics

```typescript
// ✅ Good: Track every 5 seconds
setInterval(() => {
  trackMetric('GameFPS', currentFPS);
}, 5000);

// ❌ Bad: Track every frame (too much data!)
function gameLoop() {
  trackMetric('GameFPS', currentFPS); // Called 60x/second!
}
```

### 4. Use TypeScript Types

```typescript
// ✅ Good: Type-safe
import type { Enemy } from '@types/game.types';

function handleEnemyKilled(enemy: Enemy): void {
  // Compiler ensures 'enemy' has all required properties
  trackEvent('Enemy_Killed', {
    type: enemy.type,
    wave: enemy.wave,
  });
}
```

---

## 🎉 You're All Set!

Your game now has:

### TypeScript Benefits:
- ✅ Type safety - catch bugs early
- ✅ Better IDE support - autocomplete everywhere
- ✅ Self-documenting code
- ✅ Easier refactoring
- ✅ Improved maintainability

### Application Insights Benefits:
- ✅ Real-time player monitoring
- ✅ Performance tracking
- ✅ Error tracking with stack traces
- ✅ Custom analytics
- ✅ Azure dashboard integration

---

## 📚 Resources

**TypeScript:**
- Official Docs: https://www.typescriptlang.org/docs/
- React + TypeScript: https://react-typescript-cheatsheet.netlify.app/

**Application Insights:**
- Official Docs: https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview
- JavaScript SDK: https://github.com/microsoft/ApplicationInsights-JS
- Portal: https://portal.azure.com/

---

## 🚀 Next Steps

1. **Get Instrumentation Key** from Azure Portal
2. **Add to `.env`** file
3. **Integrate into SpaceShooter** (see examples above)
4. **Deploy** and monitor in real-time!
5. **Create custom dashboards** in Azure

**Questions?**  
Check the troubleshooting section or Azure documentation!

---

**Happy coding with type safety! 🎮💙**
