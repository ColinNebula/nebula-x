# 🚀 NEBULA X

**Fast-paced retro space shooter with modern graphics** • Built with React 19 & HTML5 Canvas

<div align="center">

### [**▶️ PLAY NOW**](https://colinnebula.github.io/nebula-x/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Build: 35MB](https://img.shields.io/badge/Build-35MB-success.svg)](#📦-optimized-build)

</div>

---

## ⚡ Quick Start

```bash
# Play online (fastest)
https://colinnebula.github.io/nebula-x/

# Or run locally
npm install && npm start
# Opens at http://localhost:5173
```

**Build for production:** `npm run build` (outputs to `/build`)

---

## 🎮 Game Features

### Core Gameplay
- 🔥 **Bullet-hell combat** - Dodge intense enemy fire patterns
- 🌌 **5 zones** - Moon → Mars → Jupiter → Saturn → Uranus
- 👾 **Boss fights** - Epic battles every 5 waves, 15+ unique bosses
- 🎯 **Mini-bosses** - Must defeat before boss appears
- 💥 **Environmental hazards** - Solar flares, black holes, asteroid fields, debris storms
- ⚡ **Boss EMP defense** - Proximity electromagnetic burst when you get too close
- 🎨 **Weapon upgrades** - Speed, triple shot, homing missiles, spread, pierce, laser
- 🛸 **10+ enemy types** - Basic, fast, tank, sniper, bomber, kamikaze, fortress, stealth
- 📱 **Mobile optimized** - Industry-standard touch controls (iPhone 15 Pro Max tested)
- 🎮 **Controller support** - PS4/PS5/Xbox compatible

### Progressive Web App (PWA)
- 📲 **Install as app** - Works like native desktop/mobile app
- 🔌 **Offline play** - No internet required after install
- ⚡ **Fast loading** - Assets cached locally
- 🖥️ **Full-screen mode** - Immersive experience

---

## 🛠️ Tech Stack

| Technology | Purpose | Status |
|------------|---------|--------|
| ⚛️ React 19 | UI framework | ✅ Active |
| 🎨 Vite 7.2 | Build tool | ✅ Active |
| 🎮 HTML5 Canvas | Game rendering | ✅ Active |
| 📱 PWA | Offline support | ✅ Active |
| 💙 TypeScript | Optional types (250+ definitions) | ✅ Available |

---

## 🚀 Optional: Deploy to Azure

**Azure Static Web Apps** offers superior hosting vs GitHub Pages:
- ⚡ **Global CDN** - 3x faster worldwide
- 🔐 **Free SSL** - Automatic HTTPS for custom domains
- 🔄 **Auto CI/CD** - Push to deploy
- 🌐 **Serverless APIs** - Azure Functions included
- 💰 **FREE tier** - Same as GitHub Pages!

### Quick Deploy (10 min)
1. **Create Azure account** (free): https://azure.com/free
2. **Create Static Web App**: https://portal.azure.com/#create/Microsofthttps://thankful-stone-07408b91e.azurestaticapps.net
.StaticApp
3. **Configure:**
   - Source: GitHub → Select `nebula-x` repo
   - Build preset: Custom
   - App location: `/`
   - Output location: `build`
4. **Deploy:** GitHub Actions auto-created, push to deploy!

**URL:** `https://nebula-x.azurestaticapps.net` (custom domain supported)

---

## 🎯 Optional: Add Global Leaderboards (PlayFab)

**Microsoft Azure PlayFab** adds multiplayer features for FREE:
- 🏆 Global leaderboards
- ☁️ Cloud saves
- 🏅 Achievement tracking
- 📊 Player analytics

### Quick Setup (2 min)
1. **Get Title ID** (free): https://developer.playfab.com/
2. **Create `.env` file:**
   ```env
   REACT_APP_PLAYFAB_TITLE_ID=YOUR_TITLE_ID_HERE
   ```
3. **Restart dev server:** `npm start`

**Leaderboards auto-appear in game menu!**

---

## 📊 Optional: Analytics & Monitoring

### Application Insights (Azure)
Track performance and errors in production:
```env
REACT_APP_APPINSIGHTS_KEY=your-key-here
```
- ⚡ Real-time FPS monitoring
- 🐛 Automatic error tracking
- 📈 Player behavior analytics
- **FREE tier:** 5GB/month

### Edge DevTools (Debug)
Optimize performance during development:
- **F12** → Application tab → Canvas 3D inspector
- Performance profiler (find FPS drops)
- Memory leak detection
- Network throttling (test mobile)

---

## 📦 Optimized Build

### Current Build Size: **35 MB**
- ✅ MP4 videos excluded (moved to `media-assets/`)
- ✅ 87% size reduction from original
- ✅ GitHub Pages compatible
- ✅ Fast loading on mobile

### Largest Assets
- Audio files: ~28 MB (MP3/WAV for music & SFX)
- JS bundle: ~400 KB (gzipped: ~100 KB)
- CSS: ~86 KB (gzipped: ~15 KB)

### Large Files in `.gitignore`
All large media files auto-excluded:
- `media-assets/` directory (local dev only)
- `*.mp4` videos (155 MB + 93 MB excluded)
- `node_modules/`, `build/`, `emsdk/`
- Development scripts (100+ utility files)

---

## 📁 Project Structure

```
nebulax/
├── src/
│   ├── components/
│   │   └── SpaceShooter.jsx    # Main game component
│   ├── services/
│   │   ├── playfabService.js   # Leaderboards (optional)
│   │   └── soundSystem.js      # Audio engine
│   ├── utils/
│   └── index.js
├── public/
│   ├── assets/                 # Images, sprites, icons
│   ├── audio/                  # MP3/WAV files
│   ├── manifest.json          # PWA config
│   └── service-worker.js      # Offline caching
├── build/                      # Production output
└── package.json
```

---

## 🎯 Development Commands

```bash
# Development
npm start              # Dev server (localhost:5173)
npm run dev           # Same as start

# Production
npm run build         # Build to /build
npm run preview       # Preview production build

# Deployment
npm run deploy        # Deploy to GitHub Pages
```

---

## 🐛 Troubleshooting

### Game won't load
- Clear browser cache (Ctrl+Shift+Delete)
- Check console for errors (F12)
- Verify `npm install` completed successfully

### Poor performance
- Close other browser tabs
- Disable browser extensions
- Check GPU acceleration (Edge DevTools → Performance)
- Reduce graphics settings in game menu

### Touch controls not working
- Ensure touchscreen device
- Check Settings → Controls → Touch Enabled
- Try refreshing page

### Leaderboards not showing
- Verify `.env` file has `REACT_APP_PLAYFAB_TITLE_ID`
- Restart dev server after creating `.env`
- Check browser console for PlayFab errors

---

## 📄 License

**MIT License** - Free to use, modify, and distribute

---

## 🙏 Credits

- **Game Engine:** React 19 + HTML5 Canvas
- **Music:** Licensed royalty-free tracks
- **Sound Effects:** Mixed library + custom
- **Hosting:** GitHub Pages (or Azure Static Web Apps)
- **Built with:** Vite, TypeScript (optional), PWABuilder

---

## 🌟 Support Development

Enjoying Nebula X? Consider supporting:
- ⭐ Star this repo on GitHub
- 🐛 Report bugs via Issues
- 💡 Suggest features via Discussions
- 🔀 Contribute via Pull Requests

**Keep the game free & open source!** 🚀 
