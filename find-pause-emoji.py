#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find "MAIN MENU" in pause button
search_str = b'btn-icon">'
idx = content.find(search_str)

if idx != -1:
    # Read the next 50 bytes to see what emoji follows
    snippet = content[idx:idx+100]

    # Find the emoji between > and <
    start = snippet.find(b'>') + 1
    end = snippet.find(b'<', start)

    if start > 0 and end > start:
        emoji_bytes = snippet[start:end]
        emoji_hex = emoji_bytes.hex()

        print(f"Found emoji at position {idx}")
        print(f"Bytes: {emoji_bytes}")
        print(f"Hex: {emoji_hex}")
        try:
            decoded = emoji_bytes.decode('utf-8')
            print(f"Decoded: {decoded}")
        except:
            print(f"Could not decode as UTF-8")
