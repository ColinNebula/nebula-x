#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find "MAIN MENU" text
search_str = b'MAIN MENU'
idx = 0

while True:
    idx = content.find(search_str, idx)
    if idx == -1:
        break

    # Look backwards for btn-icon
    start = max(0, idx - 100)
    snippet = content[start:idx+20]

    if b'btn-icon' in snippet:
        print(f"\nFound MAIN MENU with btn-icon at position {idx}")
        print(f"Context: {snippet}")

        # Find the emoji between btn-icon"> and </span>
        icon_start = snippet.find(b'btn-icon">') + 10
        icon_end = snippet.find(b'</span>', icon_start)

        if icon_start > 10 and icon_end > icon_start:
            emoji_bytes = snippet[icon_start:icon_end]
            emoji_hex = emoji_bytes.hex()

            print(f"Emoji bytes: {emoji_bytes}")
            print(f"Emoji hex: {emoji_hex}")
            try:
                decoded = emoji_bytes.decode('utf-8')
                print(f"Decoded: {decoded}")
            except:
                print(f"Could not decode as UTF-8")

    idx += 1
