# 🚀 NEBULA X

A fast-paced arcade space shooter game built with React and HTML5 Canvas.

![Nebula X](nebula-x-logo.png)

## 🎮 Play Now

```bash
npm install
npm start
```

Open [https://colinnebula.github.io/nebula-x/](https://colinnebula.github.io/nebula-x/) to play!

## ✨ Features

### Core Gameplay
- **20+ Waves** of intense action with escalating difficulty
- **Epic Boss Battles** at waves 5, 10, 15, and 20
- **Mini-Bosses** with 10 unique types and 6 modifier variants
- **Power-ups**: Rapid Fire, Missiles, Shields, Speed Boost, Spread Shot, Magnet
- **Force Pod System** (Gradius-style companion with 5 upgrade levels)
- **Wave Cannon** charge attack with devastating beam
- **Graze System** - Score bonus for near-misses
- **Bomb Stock** - Screen-clearing special attacks
- **Bullet Cancel** - Convert enemy bullets to score

### Game Modes
- **Campaign** - Story mode with 20 waves and epic bosses
- **Survival Mode** - Infinite waves, 1 life, how long can you last?
- **Boss Rush** - Fight all bosses back-to-back
- **Time Attack** - Speed run through 10 waves
- **Practice Mode** - Learn patterns with customizable assists

### Practice Mode Features
- Choose any wave up to your highest reached
- Infinite Lives / Invincibility toggles
- Max Power start option
- Slow Bullets for learning patterns
- Show Hitboxes for precision training
- Scores not saved (purely for practice)

### Customization
- **6 Unique Ships** with different stats and special abilities
- **Custom Boosters** (Standard, Extended, Dual Core, Mega Thrust)
- **Wing Styles** (Standard, Extended, Swept, Delta)
- **Shield Types** (Hexagon, Bubble, Plasma, Void, Prismatic)
- **Engine Trails** (Plasma, Fire, Electric, Ice, Rainbow, Shadow)

### Controls
| Action | Keyboard | Gamepad |
|--------|----------|---------|
| Move | WASD / Arrow Keys | Left Stick / D-Pad |
| Shoot | Space / Z | A / X |
| Missiles | E / X | B / Circle |
| Bomb | Q / C | Y / Triangle |
| Focus (Slow) | Shift | L1 / LB |
| Polarity | F | R1 / RB |

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **HTML5 Canvas** - Hardware-accelerated game rendering
- **Web Audio API** - Dynamic sound system
- **Gamepad API** - Full controller support
- **localStorage** - Save/Load game progress

## 📁 Project Structure

```
nebulax/
├── public/
│   ├── *.mp3, *.wav    # Audio assets
│   ├── *.png           # Image assets
│   └── index.html
├── src/
│   ├── components/
│   │   ├── SpaceShooter.js   # Main game (~19k lines)
│   │   └── SpaceShooter.css  # Styles
│   ├── App.js
│   └── index.js
├── scripts/
│   └── prepare-github.js    # Release preparation
├── package.json
├── LICENSE (MIT)
└── README.md
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run development server at localhost:3000 |
| `npm run build` | Create optimized production build |
| `npm test` | Run test suite |
| `npm run prepare-github` | Prepare for GitHub release |

## 🚀 Deployment

Build and deploy as a static site:

```bash
npm run build
```

The `build` folder can be deployed to:
- **GitHub Pages** - Free hosting for public repos
- **Netlify** - Automatic deployments from Git
- **Vercel** - Zero-config React deployments
- **Any static hosting** - Just upload the files

### GitHub Pages Deployment

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

# Deploy
npm run deploy
```

## 🔒 Security

### Privacy
- **No data collection** - Your data stays on your device
- **No external API calls** - Fully offline capable
- **No cookies** - Just localStorage for saves
- **No tracking** - Play without being watched

### For Contributors
Before submitting code:
```bash
npm audit          # Check for vulnerabilities
npm audit fix      # Auto-fix if possible
```

Never commit: API keys, secrets, credentials, or personal data.

### Reporting Vulnerabilities
Please report security issues privately via GitHub Security Advisories rather than public issues.

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/nebulax.git`
3. **Install**: `npm install`
4. **Create branch**: `git checkout -b feature/amazing-feature`
5. **Make changes** and test with `npm start`
6. **Check security**: `npm audit`
7. **Commit**: `git commit -m "Add amazing feature"`
8. **Push**: `git push origin feature/amazing-feature`
9. **Open Pull Request**

### Code Style
- ES6+ JavaScript
- Meaningful variable names
- Comments for complex logic
- Keep functions focused

## 🎵 Credits

### Audio
- Sound effects from [Mixkit](https://mixkit.co) (Free License)
- Additional sounds from [Freesound.org](https://freesound.org)

### Inspiration
- Gradius series (Force Pod system)
- R-Type (Wave Cannon)
- Ikaruga (Polarity system)
- Touhou Project (Bullet patterns, Graze)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

Free to use, modify, and distribute. Attribution appreciated but not required.

---

**Made with ❤️ and React**

⭐ Star this repo if you enjoyed the game!
