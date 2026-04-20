import re

# Read the file
with open(r'Z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the music label - be more specific with the corrupted pattern
pattern1 = r"<span className=\"volume-label\">\{.*?\}\s*Music</span>"
replacement1 = '<span className="volume-label">🎵 Music</span>'
content = re.sub(pattern1, replacement1, content)

# Write back
with open(r'Z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed music label emoji!")
