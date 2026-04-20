# Fix corrupted emojis in pause screen
$filePath = "Z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "Starting emoji fixes..." -ForegroundColor Cyan

# Use Unicode code points for special characters
$pauseEmoji = [char]0x23F8 + [char]0xFE0F  # ⏸️
$circledA = [char]0x24B6  # Ⓐ
$circledB = [char]0x24B7  # Ⓑ
$bullet = [char]0x2022  # •
$star = [char]0x2B50  # ⭐
$rocket = [char]0x1F680  # 🚀
$trophy = [char]0x1F3C6  # 🏆
$filmReel = [char]0x1F3AC  # 🎬
$musicNote = [char]0x1F3B5  # 🎵
$warning = [char]0x26A0 + [char]0xFE0F  # ⚠️
$sparkles = [char]0x2728  # ✨
$emDash = [char]0x2014  # —
$upArrow = [char]0x2B06 + [char]0xFE0F  # ⬆️
$downArrow = [char]0x2B07 + [char]0xFE0F  # ⬇️
$leftArrow = [char]0x2B05 + [char]0xFE0F  # ⬅️
$rightArrow = [char]0x27A1 + [char]0xFE0F  # ➡️

# Fix pause heading - match with optional whitespace/corrupted chars before PAUSED
$content = $content -replace '<h2>[^>]*PAUSED</h2>', "<h2>$pauseEmoji PAUSED</h2>"

# Fix arrow keys - the corrupted chars show as question marks in different combinations
$content = $content -replace '<p>[^/]*\s*/\s*WASD\s*-\s*Move</p>', "<p>$upArrow $downArrow $leftArrow $rightArrow / WASD - Move</p>"

# Fix keyboard Lv note - handle cases with or without the corrupted char
$content = $content -replace 'Laser Beam \([^)]*3 Rapid\)', 'Laser Beam (Lv≥3 Rapid)'

# Fix hints with corrupted navigation chars
$content = $content -replace 'D-Pad to navigate[^•]*to select[^•]*ESC to resume', "D-Pad to navigate $bullet $circledA to select $bullet ESC to resume"
$content = $content -replace 'D-Pad to navigate[^•]*to select(?!</span>)', "D-Pad to navigate $bullet $circledA to select"
$content = $content -replace 'to browse[^•]*to confirm', "to browse $bullet $circledA to confirm"
$content = $content -replace 'Press[^b]*or[^b]*to go back', "Press $circledB or B to go back"

# Fix headings with missing/corrupted emojis
$content = $content -replace '<h2>[^C]*CHECKPOINT REACHED</h2>', "<h2>$star CHECKPOINT REACHED</h2>"
$content = $content -replace '<h2>[^S]*SHIP HANGAR</h2>', "<h2>$rocket SHIP HANGAR</h2>"
$content = $content -replace '<h2>[^C]*CHALLENGE MODES</h2>', "<h2>$trophy CHALLENGE MODES</h2>"
$content = $content -replace '<h2>[^R]*REPLAY SYSTEM</h2>', "<h2>$filmReel REPLAY SYSTEM</h2>"

# Fix challenge details with corrupted bullet points
$content = $content -replace 'Wave 5[^N]*No continues', "Wave 5 $bullet No continues"
$content = $content -replace 'only[^L]*Limited healing', "only $bullet Limited healing"
$content = $content -replace 'clock[^L]*Leaderboard ready', "clock $bullet Leaderboard ready"

# Fix music label - match the corrupted pattern flexibly
$content = $content -replace 'volume-label''>\{[''"][^''"]*[''"] \}\s*Music', "volume-label'>$musicNote Music"

# Fix quit modal heading - match corrupted chars before QUIT
$content = $content -replace '<h3>[^Q]*QUIT GAME\?</h3>', ("<h3>" + $warning + " QUIT GAME?</h3>")

# Fix victory screen em dashes and sparkles
$content = $content -replace 'greatest threat[^a]*an advanced', ("greatest threat " + $emDash + " an advanced")
$content = $content -replace 'became legends[^t]*their names', ("became legends " + $emDash + " their names")
$content = $content -replace '\?\s*<em>They will never be forgotten\.</em>\s*\?', ($sparkles + ' <em>They will never be forgotten.</em> ' + $sparkles)

# Fix credits heading
$content = $content -replace '<h3>[^C]*CREDITS[^<]*</h3>', ("<h3>" + $star + " CREDITS " + $star + "</h3>")

# Save with UTF8 encoding
$content | Out-File $filePath -Encoding UTF8 -NoNewline

Write-Host "Successfully fixed corrupted emojis!" -ForegroundColor Green

