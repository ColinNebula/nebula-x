#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find the corrupted emojis
search_str = b'challenge-icon'
idx = 0
count = 0

while True:
    idx = content.find(search_str, idx)
    if idx == -1:
        break

    # Read the next 50 bytes to see what emoji follows
    snippet = content[idx:idx+100]

    # Look for the closing > and opening < to find the emoji
    start = snippet.find(b'>') + 1
    end = snippet.find(b'<', start)

    if start > 0 and end > start:
        emoji_bytes = snippet[start:end]
        emoji_hex = emoji_bytes.hex()

        # Skip if it's already proper UTF-8 emoji (starts with f0 9f)
        if emoji_hex.startswith('f09f'):
            print(f"✓ Proper emoji at position {idx}: {emoji_bytes}")
        else:
            count += 1
            print(f"\n🔍 Found corrupted emoji #{count} at position {idx}")
            print(f"Bytes: {emoji_bytes}")
            print(f"Hex: {emoji_hex}")
            try:
                decoded = emoji_bytes.decode('utf-8')
                print(f"Decoded: {decoded}")
            except:
                print(f"Could not decode as UTF-8")

    idx += 1

print(f"\n{'='*50}")
print(f"Total corrupted emojis in challenge-icon: {count}")
