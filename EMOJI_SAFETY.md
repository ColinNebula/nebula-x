# Emoji Safety Guide

This project uses emojis throughout the game for power-ups, UI elements, and visual effects. To prevent emoji corruption, follow these guidelines:

## 🛡️ Protection Measures in Place

1. **`.gitattributes`** - Forces UTF-8 encoding for all source files
2. **`.editorconfig`** - Ensures consistent UTF-8 across all editors
3. **`.vscode/settings.json`** - VS Code specific UTF-8 enforcement

## ✅ Best Practices

### When Editing Files
- ✅ Always use UTF-8 encoding (check bottom-right of VS Code status bar)
- ✅ Use LF line endings (not CRLF)
- ✅ Copy emojis directly from the source file when reusing
- ❌ Don't copy-paste from external sources (can introduce wrong encoding)
- ❌ Don't use Notepad or editors that default to ANSI/Latin-1

### When Committing
```bash
# Before committing, verify file encoding:
git ls-files --eol

# All source files should show: "i/lf w/lf"
# If you see "i/crlf" or mixed, reconvert:
git add --renormalize .
```

### When Adding New Emojis
1. Copy existing emojis from `SpaceShooter.jsx` as templates
2. Or use this emoji reference:
   - ⚡ Lightning: `\u26a1`
   - 🚀 Rocket: `\ud83d\ude80`
   - 🛡️ Shield: `\ud83d\udee1\ufe0f`
   - 💣 Bomb: `\ud83d\udca3`
   - ⭐ Star: `\u2b50`
   - 🔥 Fire: `\ud83d\udd25`

### Quick Verification
```bash
# Run this to check for corrupted emojis:
npm run check-emojis

# Or directly:
node final-emoji-check.js
```

## 🚨 If Emojis Get Corrupted

Run the master fixer:
```bash
npm run fix-emojis
```

This will:
1. Fix double-encoded UTF-8 emojis (most common issue)
2. Verify all emojis are properly encoded
3. Show you a summary of fixes

**Manual fix (if needed):**
```bash
python master-emoji-fix.py
node final-emoji-check.js
```

## 📋 Common Corruption Patterns

| Corrupted | Should Be | Fix |
|-----------|-----------|-----|
| `Ã°ÂÂÂ¥` | 🚀 | Rocket emoji corrupted |
| `Ã¢ÂÂ¡` | ⚡ | Lightning emoji corrupted |
| `Ã°ÂÂÂ¡Ã¯Â¸Â` | 🛡️ | Shield emoji corrupted |
| `ÃÂ2` | ×2 | Multiplication sign corrupted |

## 🔧 Git Configuration

Ensure these git settings are correct:
```bash
git config core.autocrlf false  # Don't auto-convert line endings
git config core.safecrlf false  # Don't warn about line endings
git config core.quotepath false # Show UTF-8 filenames properly
```

## 📝 Editor Plugins

Recommended VS Code extensions:
- **EditorConfig for VS Code** - Respects .editorconfig settings
- **Encode Decode** - Quick encoding conversions if needed

---

**Last Updated:** December 18, 2025  
**Emoji Count:** 97 proper emojis in codebase  
**Status:** ✅ All emojis verified and properly encoded
