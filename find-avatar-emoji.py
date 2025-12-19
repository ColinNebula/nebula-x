#!/usr/bin/env python3
"""Find the exact pattern for avatar fallback emoji"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find the fallback pattern
pos = content.find(b"?.icon || '")
if pos != -1:
    # Get the emoji after the quote
    emoji_start = pos + 11  # Length of "?.icon || '"
    emoji_bytes = content[emoji_start:emoji_start+30]
    print("Avatar fallback emoji:")
    print(f"  Bytes: {emoji_bytes}")
    print(f"  Hex: {emoji_bytes[:20].hex()}")
    print()

    # This appears to be 🧑 (person emoji)
    # 🧑 = F0 9F A7 91 in UTF-8
    # Triple-encoded would be much longer
