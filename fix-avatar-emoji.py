#!/usr/bin/env python3
"""Fix avatar fallback emoji and any other remaining patterns"""

import re

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
changes = []

# Get full avatar emoji pattern (need to get all bytes)
pos = content.find(b"?.icon || '")
if pos != -1:
    emoji_start = pos + 11
    # Find the closing quote
    quote_end = content.find(b"'", emoji_start)
    avatar_emoji_corrupted = content[emoji_start:quote_end]
    print(f"Full corrupted avatar emoji: {avatar_emoji_corrupted.hex()}")
    print()

# The emoji appears to be 🧑 (person) = F0 9F A7 91
# OR 🚀 (rocket) = F0 9F 9A 80
# The hex shows: c3 83 c2 83 c3 82 c2 b0 c3 83 c2 82 c3 82 c2 9f c3 83 c2 82 c3 82 c2 9a c3 83 c2 82 c3 82 ...
# This looks like 🚚 or similar

# Let me find all unique triple-encoded 4-byte emoji patterns
all_replacements = [
    # Common 4-byte emojis that might be triple-encoded
    # Pattern: C3 83 C2 83 C3 82 C2 B0 ... (triple encoded F0...)

    # 🚀 rocket
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x9a\xc3\x83\xc2\x82\xc3\x82\xc2\x80',
     b'\xf0\x9f\x9a\x80'),

    # 🧑 person
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\xa7\xc3\x83\xc2\x82\xc3\x82\xc2\x91',
     b'\xf0\x9f\xa7\x91'),
]

for corrupted, correct in all_replacements:
    count = content.count(corrupted)
    if count > 0:
        emoji = correct.decode('utf-8')
        changes.append(f"Fixed {count}x {emoji}")
        content = content.replace(corrupted, correct)
        print(f"✓ Replaced {count} instances of '{emoji}'")

if changes:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {len(changes)} more emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")

    # Count remaining
    mojibake_count = content.count(b'\xc3\x83\xc2\x83') + content.count(b'\xc3\x83\xc2\x82')
    print(f"\nRemaining potential issues: {mojibake_count}")
else:
    print("\n⚠️ No matches")
