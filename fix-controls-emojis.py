#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Fix corrupted emojis in Controls screen

# 1. Arrow keys corruption (appears 4 times in the line): c383c283c382c282c383c282c382c2a0
# This is a heavily corrupted non-breaking space (&nbsp;)
corrupted_nbsp = bytes.fromhex('c383c283c382c282c383c282c382c2a0')
proper_nbsp = b'\xc2\xa0'  # &nbsp;

# 2. Laser Beam corruption patterns:
# c383c283c382c282c383c282c382c2b0 → degree symbol or similar
# c383c283c382c2b0 → another corruption
# c383c282c382c29f →
# c383c282c382c291 →
# c383c282c382c2a5 → ¥
# The whole thing seems to be "≥" (greater than or equal) - let me use ≥
corrupted_degree1 = bytes.fromhex('c383c283c382c282c383c282c382c2b0')
corrupted_degree2 = bytes.fromhex('c383c283c382c2b0')
corrupted_char1 = bytes.fromhex('c383c282c382c29f')
corrupted_char2 = bytes.fromhex('c383c282c382c291')
corrupted_char3 = bytes.fromhex('c383c282c382c2a5')
proper_gte = b'\xe2\x89\xa5'  # ≥

# 3. PlayStation button symbols:
# c383c283c382c2a2c383c282c382c29cc383c282c382c295 → ✕ (Cross button)
corrupted_cross = bytes.fromhex('c383c283c382c2a2c383c282c382c29cc383c282c382c295')
proper_cross = b'\xe2\x9c\x95'  # ✕

# c383c283c382c2a2c383c282c382c296c383c282c382c2b3 → △ (Triangle button)
corrupted_triangle = bytes.fromhex('c383c283c382c2a2c383c282c382c296c383c282c382c2b3')
proper_triangle = b'\xe2\x96\xb3'  # △

# c383c283c382c2a2c383c282c382c296c383c282c382c2a1 → □ (Square button)
corrupted_square = bytes.fromhex('c383c283c382c2a2c383c282c382c296c383c282c382c2a1')
proper_square = b'\xe2\x96\xa1'  # □

# c383c283c382c2a2c383c282c382c297c383c282c382c28b → ○ (Circle button)
corrupted_circle = bytes.fromhex('c383c283c382c2a2c383c282c382c297c383c282c382c28b')
proper_circle = b'\xe2\x97\x8b'  # ○

replacements = [
    (corrupted_nbsp, proper_nbsp, '&nbsp;', 'non-breaking spaces'),
    (corrupted_degree1, b'', '', 'corrupted degree 1'),
    (corrupted_degree2, b'', '', 'corrupted degree 2'),
    (corrupted_char1, b'', '', 'corrupted char 1'),
    (corrupted_char2, b'', '', 'corrupted char 2'),
    (corrupted_char3, proper_gte, '≥', 'greater-than-equal'),
    (corrupted_cross, proper_cross, '✕', 'PS Cross button'),
    (corrupted_triangle, proper_triangle, '△', 'PS Triangle button'),
    (corrupted_square, proper_square, '□', 'PS Square button'),
    (corrupted_circle, proper_circle, '○', 'PS Circle button'),
]

total_fixed = 0

for corrupted, proper, emoji, name in replacements:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, proper)
        total_fixed += count
        if emoji:
            print(f"✅ Fixed {count}x {emoji} ({name})")
        else:
            print(f"✅ Removed {count}x corrupted bytes ({name})")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"📊 Total fixes: {total_fixed}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes (saved {saved} bytes)")
print(f"✨ Controls screen emojis fixed!")
