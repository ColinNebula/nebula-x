# Fix corrupted emoji encoding in SpaceShooter.jsx
$filePath = "src\components\SpaceShooter.jsx"

# Read file content
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Fix corrupted emoji sequences (multi-byte corruption)
# These are the actual corrupted byte sequences showing in the file

# Left arrow ◀ (should be U+25C0, appears as Ã¢ÂÂ)
$content = $content -replace 'Ã¢ÂÂ(?!¶)', '◀'

# Right arrow ▶ (should be U+25B6, appears as Ã¢ÂÂ¶) 
$content = $content -replace 'Ã¢ÂÂ¶', '▶'

# Airplane/Wings ✈️ (appears as Ã¢ÂÂÃ¯Â¸Â)
$content = $content -replace 'Ã¢ÂÂÃ¯Â¸Â', '✈️'

# Left arrow in BACK button ← (appears as Ã¢ÂÂ before "BACK")
$content = $content -replace '(Ã¢ÂÂ)\s+BACK', '← BACK'

# Write back with UTF-8 encoding (no BOM)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)

Write-Host "Fixed emoji encodings in $filePath"
