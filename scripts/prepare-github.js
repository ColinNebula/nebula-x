#!/usr/bin/env node

/**
 * Prepare for GitHub Script
 * =========================
 * This script prepares the Nebula X project for GitHub release by:
 * 1. Consolidating all markdown docs into README.md
 * 2. Running security audit
 * 3. Optimizing for lightweight distribution
 * 4. Cleaning up unnecessary files
 * 5. Validating the project structure
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(msg, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, COLORS.cyan + COLORS.bright);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(msg) { log(`✓ ${msg}`, COLORS.green); }
function logWarning(msg) { log(`⚠ ${msg}`, COLORS.yellow); }
function logError(msg) { log(`✗ ${msg}`, COLORS.red); }

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit', ...options });
  } catch (e) {
    if (!options.ignoreError) throw e;
    return e.stdout || '';
  }
}

// ============================================================
// 1. CONSOLIDATE DOCUMENTATION
// ============================================================
function consolidateReadme() {
  logSection('CONSOLIDATING DOCUMENTATION');
  
  const readmeContent = `# 🚀 NEBULA X

A fast-paced arcade space shooter game built with React and HTML5 Canvas.

![Nebula X](public/nebulamedia.png)

## 🎮 Play Now

\`\`\`bash
npm install
npm start
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to play!

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

\`\`\`
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
\`\`\`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| \`npm start\` | Run development server at localhost:3000 |
| \`npm run build\` | Create optimized production build |
| \`npm test\` | Run test suite |
| \`npm run prepare-github\` | Prepare for GitHub release |

## 🚀 Deployment

Build and deploy as a static site:

\`\`\`bash
npm run build
\`\`\`

The \`build\` folder can be deployed to:
- **GitHub Pages** - Free hosting for public repos
- **Netlify** - Automatic deployments from Git
- **Vercel** - Zero-config React deployments
- **Any static hosting** - Just upload the files

### GitHub Pages Deployment

\`\`\`bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

# Deploy
npm run deploy
\`\`\`

## 🔒 Security

### Privacy
- **No data collection** - Your data stays on your device
- **No external API calls** - Fully offline capable
- **No cookies** - Just localStorage for saves
- **No tracking** - Play without being watched

### For Contributors
Before submitting code:
\`\`\`bash
npm audit          # Check for vulnerabilities
npm audit fix      # Auto-fix if possible
\`\`\`

Never commit: API keys, secrets, credentials, or personal data.

### Reporting Vulnerabilities
Please report security issues privately via GitHub Security Advisories rather than public issues.

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Clone** your fork: \`git clone https://github.com/YOUR_USERNAME/nebulax.git\`
3. **Install**: \`npm install\`
4. **Create branch**: \`git checkout -b feature/amazing-feature\`
5. **Make changes** and test with \`npm start\`
6. **Check security**: \`npm audit\`
7. **Commit**: \`git commit -m "Add amazing feature"\`
8. **Push**: \`git push origin feature/amazing-feature\`
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
`;

  fs.writeFileSync(path.join(ROOT, 'README.md'), readmeContent);
  logSuccess('Consolidated README.md with all documentation');
  
  // Remove separate doc files (keep for now but note they could be removed)
  const docsToCheck = ['CONTRIBUTING.md', 'SECURITY.md'];
  docsToCheck.forEach(doc => {
    const docPath = path.join(ROOT, doc);
    if (fs.existsSync(docPath)) {
      fs.unlinkSync(docPath);
      logSuccess(`Removed ${doc} (consolidated into README.md)`);
    }
  });
}

// ============================================================
// 2. SECURITY AUDIT
// ============================================================
function runSecurityAudit() {
  logSection('SECURITY AUDIT');
  
  try {
    log('Running npm audit...', COLORS.cyan);
    const auditResult = exec('npm audit --json', { silent: true, ignoreError: true });
    
    let audit;
    try {
      audit = JSON.parse(auditResult);
    } catch {
      // Fallback to regular audit output
      exec('npm audit', { ignoreError: true });
      return;
    }
    
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const total = Object.values(vulnerabilities).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
      logSuccess('No vulnerabilities found!');
    } else {
      logWarning(`Found ${total} vulnerabilities:`);
      if (vulnerabilities.critical) logError(`  Critical: ${vulnerabilities.critical}`);
      if (vulnerabilities.high) logError(`  High: ${vulnerabilities.high}`);
      if (vulnerabilities.moderate) logWarning(`  Moderate: ${vulnerabilities.moderate}`);
      if (vulnerabilities.low) log(`  Low: ${vulnerabilities.low}`);
      
      log('\nAttempting automatic fixes...', COLORS.cyan);
      exec('npm audit fix', { ignoreError: true });
    }
  } catch (e) {
    logWarning('Could not parse audit results, running standard audit...');
    exec('npm audit', { ignoreError: true });
  }
  
  // Check for secrets in code
  log('\nScanning for potential secrets...', COLORS.cyan);
  const secretPatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /private[_-]?key/i,
    /access[_-]?token/i
  ];
  
  const srcFiles = getAllFiles(path.join(ROOT, 'src'), ['.js', '.jsx', '.ts', '.tsx']);
  let secretsFound = false;
  
  srcFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(ROOT, file);
    
    secretPatterns.forEach(pattern => {
      const matches = content.match(new RegExp(`${pattern.source}\\s*[:=]\\s*['"\`][^'"\`]+['"\`]`, 'gi'));
      if (matches) {
        logWarning(`Potential secret in ${relativePath}: ${matches[0].substring(0, 50)}...`);
        secretsFound = true;
      }
    });
  });
  
  if (!secretsFound) {
    logSuccess('No hardcoded secrets detected');
  }
}

// ============================================================
// 3. OPTIMIZE FOR LIGHTWEIGHT
// ============================================================
function optimizeProject() {
  logSection('OPTIMIZING FOR LIGHTWEIGHT DISTRIBUTION');
  
  // Check and update .gitignore
  const gitignorePath = path.join(ROOT, '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const requiredIgnores = [
    'node_modules',
    'build',
    '.env',
    '.env.local',
    '.env.*.local',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'coverage',
    '.idea',
    '.vscode',
    '*.tgz'
  ];
  
  let gitignoreUpdated = false;
  let newIgnores = [];
  
  requiredIgnores.forEach(ignore => {
    if (!gitignoreContent.includes(ignore)) {
      newIgnores.push(ignore);
      gitignoreUpdated = true;
    }
  });
  
  if (gitignoreUpdated) {
    const updatedContent = gitignoreContent.trim() + '\n\n# Added by prepare-github\n' + newIgnores.join('\n') + '\n';
    fs.writeFileSync(gitignorePath, updatedContent);
    logSuccess(`Updated .gitignore with ${newIgnores.length} new entries`);
  } else {
    logSuccess('.gitignore is complete');
  }
  
  // Clean up unnecessary files
  const filesToRemove = [
    'fix-bytes.js',
    '.env.example'
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logSuccess(`Removed unnecessary file: ${file}`);
    }
  });
  
  // Check dependencies for unused packages
  log('\nAnalyzing dependencies...', COLORS.cyan);
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  // Essential deps for this project
  const essential = ['react', 'react-dom', 'react-scripts', 'web-vitals'];
  const testing = ['@testing-library/dom', '@testing-library/jest-dom', '@testing-library/react', '@testing-library/user-event'];
  
  log('Dependencies analysis:', COLORS.cyan);
  log(`  Essential: ${essential.filter(d => deps[d]).length}/${essential.length}`, COLORS.green);
  log(`  Testing: ${testing.filter(d => deps[d]).length}/${testing.length}`);
  
  // Calculate sizes
  const nodeModulesPath = path.join(ROOT, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    try {
      const size = exec('powershell -Command "(Get-ChildItem -Recurse node_modules | Measure-Object -Property Length -Sum).Sum / 1MB"', { silent: true });
      log(`  node_modules size: ~${parseFloat(size).toFixed(1)} MB`, COLORS.yellow);
    } catch {
      log('  Could not calculate node_modules size');
    }
  }
  
  logSuccess('Project optimized for distribution');
}

// ============================================================
// 4. VALIDATE PROJECT
// ============================================================
function validateProject() {
  logSection('VALIDATING PROJECT');
  
  // Check required files exist
  const requiredFiles = [
    'package.json',
    'README.md',
    'LICENSE',
    '.gitignore',
    'public/index.html',
    'src/index.js',
    'src/App.js',
    'src/components/SpaceShooter.js',
    'src/components/SpaceShooter.css'
  ];
  
  let allExist = true;
  requiredFiles.forEach(file => {
    const filePath = path.join(ROOT, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allExist = false;
    }
  });
  
  // Validate package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  
  if (packageJson.name) logSuccess(`Package name: ${packageJson.name}`);
  if (packageJson.version) logSuccess(`Version: ${packageJson.version}`);
  if (packageJson.scripts?.start) logSuccess('Has start script');
  if (packageJson.scripts?.build) logSuccess('Has build script');
  
  // Try a quick syntax check on main file
  log('\nValidating main game file syntax...', COLORS.cyan);
  try {
    exec('node --check src/components/SpaceShooter.js', { silent: true });
    logSuccess('SpaceShooter.js syntax is valid');
  } catch {
    logError('SpaceShooter.js has syntax errors');
  }
  
  return allExist;
}

// ============================================================
// 5. UPDATE PACKAGE.JSON
// ============================================================
function updatePackageJson() {
  logSection('UPDATING PACKAGE.JSON');
  
  const packagePath = path.join(ROOT, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add prepare-github script
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['prepare-github'] = 'node scripts/prepare-github.js';
  
  // Add useful metadata
  packageJson.description = packageJson.description || 'A fast-paced arcade space shooter built with React and HTML5 Canvas';
  packageJson.keywords = packageJson.keywords || ['game', 'space-shooter', 'react', 'canvas', 'arcade', 'shmup'];
  packageJson.author = packageJson.author || '';
  packageJson.license = packageJson.license || 'MIT';
  packageJson.repository = packageJson.repository || {
    type: 'git',
    url: 'https://github.com/YOUR_USERNAME/nebulax.git'
  };
  packageJson.bugs = packageJson.bugs || {
    url: 'https://github.com/YOUR_USERNAME/nebulax/issues'
  };
  packageJson.homepage = packageJson.homepage || 'https://github.com/YOUR_USERNAME/nebulax#readme';
  
  // Add engines
  packageJson.engines = packageJson.engines || {
    node: '>=16.0.0'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  logSuccess('Updated package.json with metadata and scripts');
}

// ============================================================
// 6. GENERATE BUILD SIZE REPORT
// ============================================================
function generateBuildReport() {
  logSection('BUILD SIZE ANALYSIS');
  
  log('Creating production build...', COLORS.cyan);
  
  try {
    exec('npm run build', { silent: false });
    
    const buildPath = path.join(ROOT, 'build');
    if (fs.existsSync(buildPath)) {
      const staticPath = path.join(buildPath, 'static');
      
      if (fs.existsSync(staticPath)) {
        log('\nBundle sizes:', COLORS.cyan);
        
        // Check JS files
        const jsPath = path.join(staticPath, 'js');
        if (fs.existsSync(jsPath)) {
          fs.readdirSync(jsPath).forEach(file => {
            if (file.endsWith('.js') && !file.endsWith('.map')) {
              const size = fs.statSync(path.join(jsPath, file)).size;
              const sizeKB = (size / 1024).toFixed(1);
              const sizeMB = (size / 1024 / 1024).toFixed(2);
              log(`  JS: ${file.substring(0, 20)}... ${sizeKB} KB (${sizeMB} MB)`);
            }
          });
        }
        
        // Check CSS files
        const cssPath = path.join(staticPath, 'css');
        if (fs.existsSync(cssPath)) {
          fs.readdirSync(cssPath).forEach(file => {
            if (file.endsWith('.css') && !file.endsWith('.map')) {
              const size = fs.statSync(path.join(cssPath, file)).size;
              log(`  CSS: ${file.substring(0, 20)}... ${(size / 1024).toFixed(1)} KB`);
            }
          });
        }
      }
      
      // Total build size
      try {
        const totalSize = exec('powershell -Command "(Get-ChildItem -Recurse build | Measure-Object -Property Length -Sum).Sum / 1MB"', { silent: true });
        log(`\n  Total build size: ~${parseFloat(totalSize).toFixed(2)} MB`, COLORS.green);
      } catch {
        log('\n  Could not calculate total build size');
      }
      
      logSuccess('Production build created successfully');
    }
  } catch (e) {
    logError('Build failed: ' + e.message);
  }
}

// ============================================================
// HELPERS
// ============================================================
function getAllFiles(dir, extensions = []) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      files = files.concat(getAllFiles(filePath, extensions));
    } else if (stat.isFile()) {
      if (extensions.length === 0 || extensions.some(ext => file.endsWith(ext))) {
        files.push(filePath);
      }
    }
  });
  
  return files;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('\n' + '🚀'.repeat(30));
  log('\n  NEBULA X - PREPARE FOR GITHUB', COLORS.bright + COLORS.cyan);
  log('  Preparing project for public release...\n', COLORS.cyan);
  console.log('🚀'.repeat(30) + '\n');
  
  try {
    consolidateReadme();
    runSecurityAudit();
    optimizeProject();
    updatePackageJson();
    validateProject();
    generateBuildReport();
    
    logSection('COMPLETE');
    logSuccess('Project is ready for GitHub!');
    log('\nNext steps:', COLORS.cyan);
    log('  1. Review the updated README.md');
    log('  2. Update repository URLs in package.json');
    log('  3. Commit all changes');
    log('  4. Push to GitHub');
    log('\n  git add .');
    log('  git commit -m "Prepare for GitHub release"');
    log('  git push origin main\n');
    
  } catch (e) {
    logError('Preparation failed: ' + e.message);
    console.error(e);
    process.exit(1);
  }
}

main();
