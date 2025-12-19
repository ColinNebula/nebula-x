# Comprehensive Emoji Fix Script for JSX files
# Fixes all mojibake (corrupted UTF-8) emoji sequences

param(
    [string]$FilePath = "src\components\SpaceShooter.jsx"
)

Write-Host "=== EMOJI FIX SCRIPT ===" -ForegroundColor Cyan
Write-Host "Target file: $FilePath`n" -ForegroundColor Yellow

# Read file content
$content = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)
$originalLength = $content.Length
$fixCount = 0

# Common corrupted emoji patterns (mojibake from UTF-8 double-encoding)
$emojiMap = @{
    # Navigation arrows
    'Ã¢ÂÂ¶' = '▶'  # Right arrow U+25B6
    'Ã¢ÂÂ(?!¶)' = '◀'  # Left arrow U+25C0 (negative lookahead to not match ▶)
    'Ã¢ÂÂ' = '←'  # Left arrow U+2190
    'Ã¢ÂÂº' = '→'  # Right arrow U+2192
    'Ã¢ÂÂ²' = '▲'  # Up arrow U+25B2
    'Ã¢ÂÂ¼' = '▼'  # Down arrow U+25BC
    
    # Common game emojis
    'Ã°ÂÂÂ£' = '💣'  # Bomb
    'Ã°ÂÂÂ¥' = '🔥'  # Fire
    'Ã°ÂÂÂ' = '🔫'  # Gun
    'Ã°ÂÂÂ®' = '💮'  # White flower
    'Ã°ÂÂÂ¸' = '📸'  # Camera
    'Ã°ÂÂÂ¥' = '👥'  # People
    'Ã°ÂÂÂ' = '🌊'  # Wave
    'Ã°ÂÂ§Â²' = '🧲'  # Magnet
    'Ã°ÂÂ©Â¹' = '🩹'  # Bandage
    'Ã°ÂÂÂ' = '🌌'  # Milky Way
    'Ã°ÂÂÂ ' = '🌠'  # Shooting star
    'Ã°ÂÂÂ¥' = '🔥'  # Phoenix fire
    'Ã°ÂÂÂ' = '🐉'  # Dragon
    'Ã°ÂÂÂ½' = '👽'  # Alien
    'Ã°ÂÂÂ¾' = '👾'  # Space invader
    'Ã°ÂÂÂ»' = '👻'  # Ghost
    'Ã°ÂÂÂ¿' = '👿'  # Devil
    'Ã°ÂÂÂ' = '💀'  # Skull
    'Ã°ÂÂÂ±' = '🐱'  # Cat
    'Ã°ÂÂ§Â' = '🦇'  # Bat
    'Ã°ÂÂ¦Â' = '🦁'  # Lion
    'Ã°ÂÂ¦Â' = '🦄'  # Unicorn
    'Ã°ÂÂ¦Â' = '🦅'  # Eagle
    'Ã°ÂÂ¦Â' = '🦊'  # Fox
    'Ã°ÂÂ¦Â' = '🦖'  # T-Rex
    'Ã°ÂÂ¦Â' = '🦀'  # Robot
    'Ã°ÂÂÂº' = '🐺'  # Wolf
    'Ã°ÂÂÂ¯' = '🐯'  # Tiger
    'Ã°ÂÂÂ' = '🎮'  # Game controller
    'Ã°ÂÂÂ¯' = '🎯'  # Target
    'Ã°ÂÂÂ ' = '🚀'  # Rocket
    'Ã°ÂÂÂ¸' = '🛸'  # UFO
    'Ã°ÂÂÂ' = '🛡'  # Shield
    'Ã°ÂÂÂ' = '🔱'  # Trident
    'Ã°ÂÂÂ®' = '🔮'  # Crystal ball
    'Ã°ÂÂÂ' = '💎'  # Diamond
    'Ã°ÂÂÂ«' = '💫'  # Dizzy
    'Ã°ÂÂÂ' = '🌟'  # Glowing star
    'Ã°ÂÂÂ' = '🎃'  # Pumpkin
    'Ã°ÂÂÂ' = '🎆'  # Fireworks
    'Ã°ÂÂÂ' = '🎲'  # Dice
    
    # Symbols and icons
    'Ã¢ÂÂ¡' = '⚡'  # Lightning
    'Ã¢ÂÂ ' = '⚠'  # Warning
    'Ã¢ÂÂ¢' = '☢'  # Radioactive
    'Ã¢ÂÂ«' = '⚫'  # Black circle
    'Ã¢ÂÂ°' = '⏰'  # Clock
    'Ã¢ÂÂ¨' = '✨'  # Sparkles
    'Ã¢Â­Â' = '⭐'  # Star
    'Ã¢ÂÂ³' = '✳'  # Eight-spoked asterisk
    'Ã¢ÂÂ´' = '⚔'  # Crossed swords
    'Ã¢ÂÂ' = '⚙'  # Gear
    'Ã¢ÂÂ' = '♾'  # Infinity
    'Ã¢ÂÂ' = '⬆'  # Up arrow
    'Ã¢ÂÂ' = '⬇'  # Down arrow
    'Ã¢ÂÂ' = '⬅'  # Left arrow
    'Ã¢Â¡Â' = '➡'  # Right arrow
    'Ã¢Â¡Â' = '↔'  # Left-right arrow
    'Ã¢Â¡Â' = '➜'  # Heavy right arrow
    
    # Airplane with variation selector
    'Ã¢ÂÂÃ¯Â¸Â' = '✈️'  # Airplane U+2708 U+FE0F
    
    # Misc symbols
    'Ã¢ÂÂ' = '✓'  # Checkmark
    'Ã¢ÂÂ' = '✗'  # X mark
    'ÃÂ' = '×'  # Multiplication sign
    'ÃÂ²' = '×2'  # Times 2
    'ÃÂ·' = '·'  # Middle dot
    'ÃÂ©' = '©'  # Copyright
    
    # Trophy and medals
    'Ã°ÂÂÂ†' = '🏆'  # Trophy
    'Ã°ÂÂÂ' = '🏅'  # Medal
    'Ã°ÂÂÂ' = '🏟'  # Stadium
    'Ã°ÂÂÂ' = '🏴'  # Flag
    
    # Misc game UI
    'Ã°ÂÂÂ' = '💥'  # Collision
    'Ã°ÂÂÂª' = '💪'  # Muscle
    'Ã°ÂÂÂ' = '👁'  # Eye
    'Ã°ÂÂÂ' = '👑'  # Crown
    'Ã°ÂÂÂ¨' = '⌨'  # Keyboard
    
    # Emojis with skin tone modifiers (astronaut, etc)
    'Ã°ÂÂ§Â.Ã¢ÂÂÃ°ÂÂÂ ' = '🧑‍🚀'  # Astronaut
    'Ã°ÂÂ©Â.Ã¢ÂÂÃ¯Â¸Â' = '👨‍✈️'  # Pilot
    'Ã°ÂÂ¦Â.' = '🦂'  # Helmet/Scorpion placeholder
}

Write-Host "Scanning for corrupted emoji sequences..." -ForegroundColor Yellow

foreach ($pattern in $emojiMap.Keys) {
    $replacement = $emojiMap[$pattern]
    $matches = [regex]::Matches($content, $pattern)
    
    if ($matches.Count -gt 0) {
        $content = $content -replace $pattern, $replacement
        $fixCount += $matches.Count
        Write-Host "  ✓ Fixed $($matches.Count)x: $pattern → $replacement" -ForegroundColor Green
    }
}

# Remove any UTF-8 BOM if present
if ($content.StartsWith([char]0xFEFF)) {
    $content = $content.Substring(1)
    Write-Host "  ✓ Removed UTF-8 BOM" -ForegroundColor Green
    $fixCount++
}

# Save results
if ($fixCount -gt 0) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
    Write-Host "`n✅ SUCCESS: Fixed $fixCount corrupted emoji sequences!" -ForegroundColor Green
    Write-Host "File size: $originalLength → $($content.Length) characters" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ No corrupted emojis found - file is clean!" -ForegroundColor Green
}

Write-Host "`n=== COMPLETE ===" -ForegroundColor Cyan
