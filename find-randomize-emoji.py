#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find RANDOMIZE ALL
search_str = b'RANDOMIZE ALL'
idx = content.find(search_str)

if idx != -1:
    # Look backwards for the emoji
    snippet = content[idx-50:idx+20]

    print(f"Found RANDOMIZE ALL at position {idx}")
    print(f"Context: {snippet}")
    print(f"Hex: {snippet.hex()}\n")

    # Extract just the emoji before RANDOMIZE
    emoji_start = snippet.rfind(b'\n') + 1
    emoji_end = snippet.find(b' RANDOMIZE')

    if emoji_end > emoji_start:
        emoji_bytes = snippet[emoji_start:emoji_end].strip()
        print(f"Emoji bytes: {emoji_bytes}")
        print(f"Emoji hex: {emoji_bytes.hex()}")
        try:
            decoded = emoji_bytes.decode('utf-8')
            print(f"Decoded: {decoded}")
        except:
            print("Could not decode")
