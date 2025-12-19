#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Fix the quadruple-encoded 🏠 (home emoji) in MAIN MENU button
corrupted_home = bytes.fromhex('c383c283c382c2b0c383c282c382c29fc383c282c382c28fc383c282c382c280')
proper_home = b'\xf0\x9f\x8f\x80'  # 🏠

count = content.count(corrupted_home)
if count > 0:
    content = content.replace(corrupted_home, proper_home)
    print(f"✅ Fixed {count}x 🏠 (MAIN MENU button)")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes (saved {saved} bytes)")
print(f"✨ Pause menu emoji fixed!")
