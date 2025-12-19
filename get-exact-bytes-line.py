#!/usr/bin/env python3
"""Get exact bytes from the specific corrupted lines"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find line 12775
lines = content.split(b'\n')
line_12775 = lines[12774]  # 0-indexed
print("Line 12775 (hex):")
print(line_12775.hex())
print("\nAs text:")
print(line_12775)
print()

# Find 'ÃÂ°ÃÂÃÂÃÂ' pattern
pattern_start = line_12775.find(b"' + transition.level + '")
if pattern_start != -1:
    emoji_start = pattern_start + 25  # After the quote
    emoji_bytes = line_12775[emoji_start:emoji_start+30]
    print(f"\nEmoji bytes after 'LEVEL ':")
    print(f"  Hex: {emoji_bytes.hex()}")
    print(f"  Text: {emoji_bytes}")
