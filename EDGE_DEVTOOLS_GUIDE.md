# 🔧 Microsoft Edge DevTools for Nebula X Game Development

## Overview

Microsoft Edge DevTools provides **powerful game development features** that Chrome DevTools doesn't have. Use these tools to optimize performance, debug rendering, find memory leaks, and test mobile performance.

---

## 🚀 Getting Started

### Open Edge DevTools

1. **Open Nebula X in Microsoft Edge**
   ```
   http://localhost:5173
   ```

2. **Open DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Or right-click → Inspect

3. **Enable Game Development Features**
   - Settings (⚙️) → Experiments
   - ✅ Enable "3D View"
   - ✅ Enable "Performance monitor"

---

## 🎮 1. 3D Canvas Inspection

**What It Does:** Visualize your Canvas element in 3D, inspect layers, and debug rendering issues.

### How to Use 3D View

1. **Open 3D View Tab**
   - DevTools → More tools (+) → 3D View
   - Or press `Ctrl+Shift+P` → "Show 3D View"

2. **Inspect Canvas Layers**
   ```
   Features:
   - Rotate/zoom 3D page view
   - See Canvas z-index stacking
   - Identify overlapping elements
   - Debug transparency issues
   ```

3. **Use Cases for Nebula X**
   - ✅ Verify Canvas is topmost layer
   - ✅ Check UI overlays (pause menu, leaderboard)
   - ✅ Debug z-index conflicts
   - ✅ Inspect element positioning

### Canvas Compositing Layers

1. **Open Layers Tab**
   - 3D View → Compositing Layers

2. **What to Check**
   ```
   Canvas Element:
   - Should be hardware-accelerated
   - Green = GPU-accelerated ✅
   - Red = CPU rendering ⚠️
   ```

3. **Optimize Canvas Rendering**
   ```css
   /* Force GPU acceleration if needed */
   canvas {
     will-change: transform;
     transform: translateZ(0);
   }
   ```

---

## ⚡ 2. Performance Profiling for Games

**What It Does:** Record and analyze game performance, identify FPS drops, and find bottlenecks.

### Performance Monitor (Real-Time)

1. **Open Performance Monitor**
   - DevTools → More tools (+) → Performance monitor
   - Or `Ctrl+Shift+P` → "Show Performance monitor"

2. **Key Metrics to Watch**
   ```
   FPS (Frames Per Second):
   - Target: 60 FPS ✅
   - Warning: 30-60 FPS ⚠️
   - Critical: <30 FPS ❌

   CPU Usage:
   - Target: <50% ✅
   - Warning: 50-80% ⚠️
   - Critical: >80% ❌

   JS Heap Size:
   - Watch for constant growth (memory leak!)
   - Should stabilize after initial load

   DOM Nodes:
   - Should stay relatively constant
   - Growing = possible React leaks

   Layouts/Recalcs:
   - Should be minimal during gameplay
   - Spikes = DOM manipulation during game loop
   ```

### Performance Recording (Detailed Analysis)

1. **Record Gameplay**
   - Performance tab → Record (⏺️)
   - Play game for 10-30 seconds
   - Stop recording

2. **Analyze Recording**

   **Main Thread Activity:**
   ```
   Look for:
   - Long tasks (>50ms) = frame drops
   - requestAnimationFrame gaps = stuttering
   - Scripting time = JavaScript execution
   - Rendering time = painting/compositing
   ```

   **FPS Chart:**
   ```
   Green bars = 60 FPS ✅
   Yellow bars = 30-60 FPS ⚠️
   Red bars = <30 FPS ❌
   
   Look for:
   - Consistent FPS = smooth gameplay
   - Drops during boss spawns = optimization needed
   - Drops during particle effects = reduce particles
   ```

   **Bottom-Up Tab:**
   ```
   Shows which functions take the most time:
   1. Sort by "Self Time"
   2. Find your game functions
   3. Optimize the slowest ones
   
   Common Nebula X bottlenecks:
   - Enemy collision detection
   - Particle rendering
   - Bullet updates
   ```

3. **Performance Best Practices for Nebula X**

   ```javascript
   // ❌ BAD: Creates new array every frame
   function gameLoop() {
     enemies.filter(e => e.health > 0).forEach(updateEnemy);
   }

   // ✅ GOOD: Reuse array, avoid allocations
   function gameLoop() {
     for (let i = 0; i < enemies.length; i++) {
       if (enemies[i].health > 0) {
         updateEnemy(enemies[i]);
       }
     }
   }

   // ❌ BAD: Expensive distance calculation every frame
   function checkCollision(a, b) {
     const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
     return dist < a.radius + b.radius;
   }

   // ✅ GOOD: Use squared distance (no sqrt)
   function checkCollision(a, b) {
     const dx = a.x - b.x;
     const dy = a.y - b.y;
     const distSq = dx * dx + dy * dy;
     const radiusSum = a.radius + b.radius;
     return distSq < radiusSum * radiusSum;
   }
   ```

---

## 🧠 3. Memory Leak Detection

**What It Does:** Find and fix memory leaks that cause game slowdown over time.

### Memory Profiling

1. **Take Heap Snapshots**
   - Memory tab → Heap snapshot
   - Take snapshot #1 (game menu)
   - Play for 5 minutes
   - Take snapshot #2
   - Stop game, return to menu
   - Take snapshot #3
   
2. **Compare Snapshots**
   ```
   Snapshot #3 should be similar to #1
   If #3 >> #1 = Memory leak!
   ```

3. **Find Leaks**
   - Select snapshot #3
   - Comparison: "Objects allocated between Snapshot 1 and 3"
   - Look for:
     - Growing arrays (enemies, bullets, particles)
     - Event listeners not removed
     - Canvas contexts not released
     - Timers/intervals not cleared

### Allocation Instrumentation

1. **Record Allocations**
   - Memory tab → Allocation instrumentation on timeline
   - Start recording
   - Go to menu → Start game → Play 1 wave → Back to menu
   - Stop recording

2. **What to Look For**
   ```
   Timeline should show:
   - Spikes during gameplay ✅ Normal
   - Gradual upward trend ⚠️ Possible leak
   - Never decreasing ❌ Definite leak
   
   Blue bars = allocated
   Gray bars = garbage collected
   
   More gray = good (GC is working)
   All blue = bad (objects not being freed)
   ```

### Common Memory Leaks in Games

```javascript
// ❌ MEMORY LEAK: Event listeners not removed
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  // Missing cleanup!
}, []);

// ✅ FIX: Remove listeners on unmount
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, []);

// ❌ MEMORY LEAK: Intervals not cleared
useEffect(() => {
  setInterval(() => {
    updateGame();
  }, 16);
}, []);

// ✅ FIX: Clear intervals
useEffect(() => {
  const interval = setInterval(() => {
    updateGame();
  }, 16);
  return () => {
    clearInterval(interval);
  };
}, []);

// ❌ MEMORY LEAK: References to destroyed objects
const enemies = [];
function spawnEnemy() {
  const enemy = { /* ... */ };
  enemies.push(enemy);
  // Never removed from array!
}

// ✅ FIX: Remove destroyed objects
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      enemies.splice(i, 1); // Remove from array
    }
  }
}
```

### Memory Best Practices

```javascript
// Object pooling for particles
class ParticlePool {
  constructor(size) {
    this.particles = Array(size).fill(null).map(() => ({
      active: false,
      x: 0, y: 0, vx: 0, vy: 0
    }));
  }

  spawn(x, y, vx, vy) {
    // Reuse inactive particle instead of creating new one
    const particle = this.particles.find(p => !p.active);
    if (particle) {
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.vx = vx;
      particle.vy = vy;
    }
  }

  update() {
    for (const p of this.particles) {
      if (p.active) {
        p.x += p.vx;
        p.y += p.vy;
        if (/* out of bounds */) {
          p.active = false; // Recycle instead of delete
        }
      }
    }
  }
}
```

---

## 📱 4. Network Throttling for Mobile Testing

**What It Does:** Simulate slow mobile connections to test loading performance.

### Network Throttling

1. **Open Network Tab**
   - DevTools → Network tab

2. **Enable Throttling**
   ```
   Throttling dropdown → Presets:
   
   - No throttling (default)
   - Slow 3G (400ms latency, 400kb/s down, 400kb/s up)
   - Fast 3G (562.5ms latency, 1.6Mb/s down, 750kb/s up)
   - Slow 4G (20ms latency, 4Mb/s down, 3Mb/s up)
   - Fast 4G (5ms latency, 20Mb/s down, 15Mb/s up)
   ```

3. **Test Nebula X Loading**
   - Throttle to "Slow 3G"
   - Reload page
   - Check:
     - Is loading screen visible?
     - Does game start before assets load?
     - Are placeholders shown?
     - How long until playable?

### Custom Throttling Profiles

**Create "Mobile Gaming" Profile:**
```
Download: 2 Mb/s
Upload: 1 Mb/s
Latency: 100ms

This simulates:
- Budget smartphone
- Average WiFi
- Typical gaming conditions
```

### Asset Loading Analysis

1. **Filter by Type**
   ```
   Network tab filters:
   - JS = JavaScript files
   - CSS = Stylesheets
   - Img = Images/sprites
   - Media = Audio files
   - Font = Web fonts
   - Doc = HTML
   ```

2. **Optimize Loading**

   **Check Asset Sizes:**
   ```
   Look for:
   - Large images (>500KB) = compress
   - Uncompressed audio (>1MB) = use MP3/OGG
   - Multiple small files = bundle
   - Unused assets = remove
   ```

   **Check Load Timing:**
   ```
   Waterfall view shows:
   - Queueing (gray) = waiting for connection
   - Stalled (orange) = waiting for available connection
   - Request sent (light green) = uploading request
   - Waiting (green) = server processing
   - Content download (blue) = downloading response
   
   Optimize:
   - Parallel downloads = use CDN
   - Long waits = enable compression
   - Large downloads = reduce file size
   ```

### Service Worker Caching

**Test Offline Performance:**

1. **Enable Service Worker**
   - Application tab → Service Workers
   - ✅ Offline checkbox

2. **Reload Page**
   - Should load from cache
   - Network tab shows "(from ServiceWorker)"

3. **Verify Assets Cached**
   - Application → Cache Storage
   - Check nebula-x-cache-v1
   - Should contain all game assets

---

## 🎯 Edge-Specific Features

### Features Chrome DevTools Doesn't Have

**1. 3D View**
- Visualize page layers in 3D
- Inspect Canvas z-index
- Debug element stacking

**2. Issues Panel**
- Automatic performance warnings
- Accessibility issues
- Security problems
- Best practice violations

**3. PWA Testing**
- Application → Manifest
- Test install prompt
- Verify icons/screenshots
- Check service worker

**4. WebView2 Debugging**
- Debug Electron apps
- Debug native Windows apps
- Remote debugging

---

## 📊 Performance Checklist for Nebula X

### Before Release

- [ ] **FPS:** Maintains 60 FPS during heavy combat
- [ ] **Memory:** No leaks after 30+ minutes
- [ ] **Mobile:** Loads in <5 seconds on Slow 3G
- [ ] **Canvas:** GPU-accelerated (green in 3D View)
- [ ] **Assets:** All files <500KB
- [ ] **Service Worker:** Works offline
- [ ] **Network:** <100 requests on initial load
- [ ] **JavaScript:** Main bundle <500KB
- [ ] **Cold Start:** Playable in <3 seconds
- [ ] **Audio:** Background music doesn't stutter

### Performance Targets

```
Desktop (Recommended):
- FPS: 60 ✅
- Load Time: <2 seconds
- Memory: <200MB
- CPU: <50%

Mobile (Minimum):
- FPS: 30 ✅
- Load Time: <5 seconds
- Memory: <150MB
- CPU: <80%

Low-End Device:
- FPS: 24 ✅
- Load Time: <10 seconds
- Memory: <100MB
- Playable with reduced effects
```

---

## 🔍 Debugging Workflows

### Scenario 1: Game Slows Down Over Time

**Problem:** Game starts at 60 FPS, drops to 30 FPS after 10 minutes

**Debug Steps:**
1. Memory tab → Record allocations
2. Play for 10 minutes
3. Stop recording
4. Look for upward memory trend
5. Find objects not being garbage collected
6. Fix: Remove references, clear arrays, cleanup event listeners

### Scenario 2: FPS Drops During Boss Battles

**Problem:** FPS drops to 30 when boss spawns

**Debug Steps:**
1. Performance tab → Record
2. Start boss battle
3. Stop recording after boss defeated
4. Find slowest functions in Bottom-Up tab
5. Common causes:
   - Too many particles
   - Complex collision detection
   - Expensive boss AI calculations
6. Fix: Reduce particles, optimize algorithms, use spatial partitioning

### Scenario 3: Slow Loading on Mobile

**Problem:** Game takes 15+ seconds to load on phone

**Debug Steps:**
1. Network tab → Throttle to Slow 3G
2. Reload page
3. Sort by file size (descending)
4. Check waterfall timing
5. Common causes:
   - Large uncompressed images
   - Too many audio files
   - Synchronous script loading
6. Fix: Compress images, lazy-load audio, async scripts, enable service worker

### Scenario 4: Memory Leak from Event Listeners

**Problem:** Memory grows continuously, never decreases

**Debug Steps:**
1. Memory tab → Heap snapshot #1
2. Play for 5 minutes
3. Heap snapshot #2
4. Compare snapshots
5. Look for: "Detached DOM trees", event listeners
6. Fix: Remove event listeners in useEffect cleanup

---

## 🛠️ Recommended Edge Extensions

### Performance Testing
- **Lighthouse** - Automated performance audits
- **React Developer Tools** - Component profiling
- **Redux DevTools** - State debugging

### Asset Optimization
- **Image Size Checker** - Verify image compression
- **Bundle Analyzer** - Visualize JavaScript bundle sizes

---

## 📚 Additional Resources

**Microsoft Edge DevTools Documentation:**
- https://learn.microsoft.com/microsoft-edge/devtools-guide-chromium/

**3D View:**
- https://learn.microsoft.com/microsoft-edge/devtools-guide-chromium/3d-view/

**Performance:**
- https://learn.microsoft.com/microsoft-edge/devtools-guide-chromium/evaluate-performance/

**Memory:**
- https://learn.microsoft.com/microsoft-edge/devtools-guide-chromium/memory-problems/

**Network:**
- https://learn.microsoft.com/microsoft-edge/devtools-guide-chromium/network/

---

## 🎮 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  EDGE DEVTOOLS GAME DEVELOPMENT SHORTCUTS                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Open DevTools:          F12                                │
│  Command Menu:           Ctrl+Shift+P                       │
│  Performance Monitor:    Ctrl+Shift+P → "Performance"       │
│  3D View:                Ctrl+Shift+P → "3D View"           │
│  Memory Snapshot:        Memory → Heap snapshot             │
│  Network Throttling:     Network → Throttling dropdown      │
│  Offline Mode:           Application → Service Workers      │
│                                                              │
│  Performance Recording:                                      │
│    1. Performance tab                                        │
│    2. Record (⏺️)                                            │
│    3. Play game                                              │
│    4. Stop (⏹️)                                              │
│    5. Analyze FPS/bottlenecks                               │
│                                                              │
│  Memory Leak Detection:                                      │
│    1. Memory tab                                             │
│    2. Heap snapshot (menu)                                   │
│    3. Heap snapshot (after 5 min)                           │
│    4. Compare snapshots                                      │
│    5. Find growing objects                                   │
│                                                              │
│  Target Metrics:                                             │
│    FPS:        60                                            │
│    CPU:        <50%                                          │
│    Memory:     <200MB                                        │
│    Load Time:  <3 seconds                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Next Steps

1. **Open Nebula X in Edge:** http://localhost:5173
2. **Enable 3D View:** Settings → Experiments → Enable
3. **Start Performance Monitor:** Watch FPS during gameplay
4. **Record Gameplay:** Find and optimize bottlenecks
5. **Check for Memory Leaks:** Take heap snapshots
6. **Test Mobile Performance:** Throttle to Slow 3G

**Edge DevTools + Application Insights = Complete Game Monitoring! 🔧📊**

Use Edge DevTools during development to find and fix issues, then use Application Insights in production to monitor real player performance!
