#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Fix patterns:
# 1. ð¯ → 🎯 (dart/target emoji)
corrupted_dart = bytes.fromhex('c3b0c29fc28ec2af')
proper_dart = b'\xf0\x9f\x8e\xaf'  # 🎯

# 2. ð¹ → 📹 (video camera emoji)
corrupted_video = bytes.fromhex('c3b0c29fc293c2b9')
proper_video = b'\xf0\x9f\x93\xb9'  # 📹

# 3. ÃÂ°ÃÂÃÂÃÂ → 🏆 (trophy - for challenges)
corrupted_trophy = bytes.fromhex('c383c283c382c2b0c383c282c382c29fc383c282c382c292c383c282c382c280')
proper_trophy = b'\xf0\x9f\x8f\x86'  # 🏆

# 4. ÃÂ¢ÃÂÃÂ±ÃÂ¯ÃÂ¸ÃÂ → ⏱️ (stopwatch - for time challenges)
corrupted_stopwatch = bytes.fromhex('c383c283c382c2a2c383c282c382c28fc383c282c382c2b1c383c283c382c2afc383c282c382c2b8c383c282c382c28f')
proper_stopwatch = b'\xe2\x8f\xb1\xef\xb8\x8f'  # ⏱️

replacements = [
    (corrupted_dart, proper_dart, '🎯', 'Practice Mode'),
    (corrupted_video, proper_video, '📹', 'Replays'),
    (corrupted_trophy, proper_trophy, '🏆', 'Trophy'),
    (corrupted_stopwatch, proper_stopwatch, '⏱️', 'Stopwatch'),
]

total_fixed = 0

for corrupted, proper, emoji, name in replacements:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, proper)
        total_fixed += count
        print(f"✅ Fixed {count}x {emoji} ({name})")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"📊 Total fixes: {total_fixed}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes (saved {saved} bytes)")
print(f"✨ Mission Select emojis fixed!")
