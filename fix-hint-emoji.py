#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Fix the corrupted multi-level encoded button symbol
# The pattern c383c283c382c283c383c282c382c282c383c283c382c283c383c282c382c285
# This appears to be ❌ (X button) that got corrupted
corrupted_x = bytes.fromhex('c383c283c382c283c383c282c382c282c383c283c382c283c383c282c382c285')
proper_x = b'\xe2\x9d\x8c'  # ❌

count = content.count(corrupted_x)
if count > 0:
    content = content.replace(corrupted_x, proper_x)
    print(f"✅ Fixed {count}x ❌ (corrupted button symbol in hint)")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes (saved {saved} bytes)")
print(f"✨ Controls hint emojis fixed!")
