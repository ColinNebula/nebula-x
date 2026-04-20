# PlayFab Setup Guide - Azure Gaming Backend

Complete guide to integrating PlayFab with Nebula X for leaderboards, achievements, cloud saves, and player analytics.

## 🎯 What PlayFab Adds to Your Game

- **🏆 Global Leaderboards** - Real-time high score rankings
- **🎖️ Achievements** - Track and sync player accomplishments
- **☁️ Cloud Saves** - Cross-device game progression
- **📊 Analytics** - Player behavior tracking and insights
- **🎮 LiveOps** - A/B testing, events, tournaments
- **💯 FREE Tier** - Up to 100,000 players, 1.5M API calls/month!

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Create PlayFab Account

1. Go to **https://developer.playfab.com/**
2. Click **"Sign up"** (it's free!)
3. Create account or sign in with Microsoft/GitHub

### Step 2: Create Your Game Title

1. Click **"New Title"**
2. **Title Name**: `Nebula X`
3. **Studio**: Create new or select existing
4. Click **"Create Studio and Title"**

### Step 3: Get Your Title ID

1. In PlayFab dashboard, go to **Settings** → **Title Settings**
2. Copy your **Title ID** (looks like: `ABC12`)
3. Keep this handy!

### Step 4: Configure Nebula X

**Option A: Environment Variable (Recommended)**
```bash
# Create .env file in project root
REACT_APP_PLAYFAB_TITLE_ID=ABC12
```

**Option B: Direct Configuration**
Edit `src/services/playfabConfig.js`:
```javascript
titleId: 'ABC12', // Replace with your Title ID
```

### Step 5: Set Up Leaderboards

1. In PlayFab dashboard: **Leaderboards** → **Statistics**
2. Click **"New Statistic"** and create these:

| Statistic Name | Aggregation Method | Reset Frequency |
|----------------|-------------------|-----------------|
| `HighScores` | Maximum | Never |
| `SurvivalMode` | Maximum | Never |
| `BossRushMode` | Maximum | Never |
| `TimeAttackMode` | Maximum | Never |
| `TotalScore` | Sum | Never |
| `GamesPlayed` | Sum | Never |
| `EnemiesKilled` | Sum | Never |
| `BossesDefeated` | Sum | Never |
| `WavesCompleted` | Maximum | Never |

**IMPORTANT**: Statistic names must match exactly!

### Step 6: Test It!

1. Run the game: `npm start`
2. Check browser console for: `✅ PlayFab login successful`
3. Play a game and check the leaderboard!

---

## 🎮 How It Works

### Automatic Features (No Code Needed)

Once configured, PlayFab automatically:
- ✅ Logs in players anonymously (no password required)
- ✅ Saves high scores to leaderboards
- ✅ Tracks achievements
- ✅ Syncs progress across devices
- ✅ Shows player rankings

### Manual Integration (Already Done!)

The following files have been created:

```
src/
├── services/
│   ├── playfabConfig.js      # Configuration
│   └── playfabService.js     # API wrapper
├── components/
│   ├── Leaderboard.jsx       # Leaderboard UI
│   └── PlayFabStatus.jsx     # Connection indicator
└── hooks/
    └── usePlayFab.js         # React hook for easy integration
```

---

## 🔧 Integration with Your Game

### Basic Integration (Recommended)

Add to your `SpaceShooter.jsx`:

```javascript
import { usePlayFab } from '../hooks/usePlayFab';
import Leaderboard from './Leaderboard';
import PlayFabStatus from './PlayFabStatus';

const SpaceShooter = () => {
  const { submitScore, trackEvent, saveProgress, isConnected } = usePlayFab();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // When game ends, submit score
  const handleGameOver = async () => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('spaceShooterHighScore', score);
      
      // 🆕 Submit to cloud leaderboard
      if (isConnected) {
        await submitScore(score, gameMode);
      }
    }
  };

  // Track events
  const handleEnemyKilled = () => {
    trackEvent('EnemyKilled', { enemyType: 'fighter', wave });
  };

  // Save progress periodically
  useEffect(() => {
    if (isConnected) {
      saveProgress({
        highScore,
        gameBeaten,
        highestWave: wave,
        achievements: unlockedAchievements,
      });
    }
  }, [wave, unlockedAchievements]);

  return (
    <>
      {/* Connection status indicator */}
      <PlayFabStatus />
      
      {/* Your game canvas */}
      <canvas ref={canvasRef} />
      
      {/* Leaderboard modal */}
      {showLeaderboard && (
        <Leaderboard 
          gameMode={gameMode}
          onClose={() => setShowLeaderboard(false)} 
        />
      )}
    </>
  );
};
```

---

## 📊 PlayFab Dashboard Features

### 1. View Leaderboards
- **Leaderboards** → **Leaderboards** → Select statistic
- See real-time player rankings
- Export to CSV for analysis

### 2. Player Analytics
- **Data** → **Players** → Search by ID
- View individual player stats
- See playtime, last login, achievements

### 3. Track Events
- **Data** → **Events** → **PlayStream Monitor**
- Real-time event stream (enemy kills, powerups, etc.)
- Set up webhooks for Discord/Slack notifications

### 4. A/B Testing
- **Automation** → **Experiments**
- Test different difficulty curves
- Optimize powerup drop rates

### 5. Push Notifications (Future)
- **Engagement** → **Push Notifications**
- Notify players of new content
- Tournament announcements

---

## 🚀 Advanced Features

### Custom Events (Analytics)

Track anything you want:

```javascript
// Track boss defeat
trackEvent('BossDefeated', {
  bossName: 'Destroyer',
  wave: 5,
  timeTaken: 45.3,
  damageReceived: 200,
});

// Track powerup usage
trackEvent('PowerupUsed', {
  powerupType: 'SHIELD',
  wave: 3,
  enemiesOnScreen: 15,
});
```

View in: **Data** → **Events** → **PlayStream Monitor**

### Cloud Save Sync

Merge local and cloud progress:

```javascript
const { syncWithCloud } = usePlayFab();

// On game start, sync with cloud
useEffect(() => {
  const localData = {
    highScore: parseInt(localStorage.getItem('spaceShooterHighScore')) || 0,
    achievements: JSON.parse(localStorage.getItem('nebulaXAchievements')) || [],
  };
  
  syncWithCloud(localData).then(({ mergedData }) => {
    // Use merged data (best of local + cloud)
    setHighScore(mergedData.highScore);
    setUnlockedAchievements(mergedData.achievements);
  });
}, []);
```

### Weekly Leaderboards

Create rotating leaderboards:

1. PlayFab Dashboard → **Leaderboards** → **New Statistic**
2. **Reset Frequency**: Weekly (Monday at 00:00 UTC)
3. **Aggregation**: Maximum
4. Players compete each week for top score!

### Tournaments & Events

1. **Automation** → **Scheduled Tasks**
2. Create task: `StartWeekendTournament`
3. Set trigger: Every Friday 6 PM
4. Configure rewards for top players

---

## 🔒 Security Best Practices

### ✅ DO:
- Use environment variables for Title ID in production
- Never commit `.env` files to git
- Use PlayFab's title data for game configuration
- Enable HTTPS-only API calls (production)

### ❌ DON'T:
- Hard-code secrets in client-side code
- Trust client-reported scores without validation
- Expose secret keys in frontend

### Server-Side Validation (Optional)

For competitive games, validate scores server-side:

1. **Automation** → **Cloud Script**
2. Write JavaScript function to validate scores
3. Reject impossible scores (too high, too fast,etc.)

---

## 📈 Monitoring & Optimization

### Check Your Usage

1. **Settings** → **Usage & Billing**
2. Free tier limits:
   - 100,000 Monthly Active Users
   - 1.5M API calls/month
   - 25 GB bandwidth

### Optimize API Calls

```javascript
// ❌ BAD: Call after every kill
enemyKilled.forEach(() => submitScore(score));

// ✅ GOOD: Batch updates
useEffect(() => {
  if (gameState === 'gameOver') {
    submitScore(finalScore);
  }
}, [gameState]);
```

### Caching

```javascript
// Cache leaderboard for 5 minutes
const cachedLeaderboard = useMemo(() => {
  return getLeaderboard(gameMode);
}, [gameMode, Math.floor(Date.now() / 300000)]);
```

---

## 🐛 Troubleshooting

### Login Fails

```
Error: Title ID not configured
```
**Fix**: Replace `YOUR_TITLE_ID_HERE` in `playfabConfig.js`

### Leaderboard Empty

```
No scores visible
```
**Fix**: Ensure statistics are created in PlayFab dashboard with exact names

### Scores Not Updating

```
✅ Score submitted but not visible
```
**Fix**: Statistics take ~30 seconds to appear in dashboard. Check **Leaderboards** tab after a minute.

### CORS Errors

```
Access to fetch blocked by CORS policy
```
**Fix**: PlayFab handles CORS automatically. Ensure you're using HTTPS in production.

---

## 💡 Tips & Tricks

### 1. Test with Multiple Accounts

```javascript
// Clear device ID to create new account
localStorage.removeItem('playfab_device_id');
window.location.reload();
```

### 2. Debug Mode

Add to `playfabConfig.js`:
```javascript
debug: process.env.NODE_ENV === 'development',
```

### 3. Offline Mode

PlayFab automatically queues actions when offline and syncs when reconnected!

### 4. Player Segmentation

Group players by performance:
- **Settings** → **Player Segments**
- Create segment: "High Scorers" (score > 50,000)
- Send targeted notifications/rewards

---

## 📚 Resources

- **PlayFab Docs**: https://docs.microsoft.com/gaming/playfab/
- **API Reference**: https://docs.microsoft.com/gaming/playfab/api-references/
- **Community Forum**: https://community.playfab.com/
- **SDK GitHub**: https://github.com/PlayFab/JavaScriptSDK

---

## 🎉 You're Done!

Your game now has:
- ✅ Global leaderboards
- ✅ Cloud saves
- ✅ Achievement tracking
- ✅ Player analytics
- ✅ Cross-device progression

**Next Steps:**
1. Deploy to production: `npm run build && npm run deploy`
2. Share leaderboard link with players
3. Monitor analytics in PlayFab dashboard
4. Add tournaments and special events!

Happy gaming! 🚀🎮
