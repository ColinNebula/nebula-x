#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Fix the corrupted dice emoji
# ð² is double-encoded 🎲
corrupted_dice = b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xb2'
proper_dice = b'\xf0\x9f\x8e\xb2'  # 🎲

count = content.count(corrupted_dice)
if count > 0:
    content = content.replace(corrupted_dice, proper_dice)
    print(f"✅ Fixed {count}x 🎲 (dice emoji)")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes (saved {saved} bytes)")
print(f"✨ Randomize button emoji fixed!")
