#!/usr/bin/env python3
"""Fix double-encoded UTF-8 emojis in customize overlay (Ship Hangar)"""

import os

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

# Double-encoded → Correct UTF-8 mappings for customize screen
replacements = {
    # Navigation arrows
    b'\xc3\xa2\xc2\x97\xc2\x84': b'\xe2\x97\x80',  # ◀ left arrow
    b'\xc3\xa2\xc2\x96\xc2\xb6': b'\xe2\x96\xb6',  # ▶ right arrow

    # Wing emoji (✈️ airplane)
    b'\xc3\xa2\xc2\x9c\xc2\x88\xc3\xaf\xc2\xb8\xc2\x8f': b'\xe2\x9c\x88\xef\xb8\x8f',

    # Gamepad emoji (🎮)
    b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xae': b'\xf0\x9f\x8e\xae',

    # Button emojis (🅰️ 🅱️)
    b'\xc3\xb0\xc2\x9f\xc2\x85\xc2\xb0': b'\xf0\x9f\x85\xb0',  # 🅰️
    b'\xc3\xb0\xc2\x9f\xc2\x85\xc2\xb1': b'\xf0\x9f\x85\xb1',  # 🅱️

    # Back arrow
    b'\xc3\xa2\xc2\x86\xc2\xa9': b'\xe2\x86\xa9',  # ↩ back arrow
}

# Read file
with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
changes_made = []

# Apply replacements
for corrupted, correct in replacements.items():
    count = content.count(corrupted)
    if count > 0:
        emoji_char = correct.decode('utf-8')
        changes_made.append(f"  Fixed {count}x '{emoji_char}'")
        content = content.replace(corrupted, correct)

# Write back
with open(file_path, 'wb') as f:
    f.write(content)

print(f"✅ Fixed customize overlay emojis!")
print(f"File size: {original_size} → {len(content)} bytes")
if changes_made:
    print("\nChanges:")
    for change in changes_made:
        print(change)
else:
    print("\n⚠️ No corrupted emojis found (already fixed?)")
