#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Fix the remaining corruption in arrow keys line
# c383c283c382c283c383c282c382c282 → should be removed (it's between nbsp and next arrow)
corrupted_between = bytes.fromhex('c383c283c382c283c383c282c382c282')

count = content.count(corrupted_between)
if count > 0:
    content = content.replace(corrupted_between, b'')
    print(f"✅ Removed {count}x corrupted bytes between arrow keys")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes (saved {saved} bytes)")
print(f"✨ Arrow keys line fully fixed!")
