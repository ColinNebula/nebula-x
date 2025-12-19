#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find back-button with corrupted emoji
search_str = b'back-button">'
idx = 0

while True:
    idx = content.find(search_str, idx)
    if idx == -1:
        break

    # Read the next 50 bytes
    snippet = content[idx:idx+80]

    print(f"\nFound back-button at position {idx}")
    print(f"Context: {snippet}")

    # Find text between > and BACK
    start = snippet.find(b'>') + 1
    end = snippet.find(b'BACK', start)

    if start > 0 and end > start:
        text_before_back = snippet[start:end].strip()

        if text_before_back and not text_before_back.startswith(b'\xe2\x97\x80'):  # Not ◀
            print(f"Text before BACK: {text_before_back}")
            print(f"Hex: {text_before_back.hex()}")
            try:
                decoded = text_before_back.decode('utf-8')
                print(f"Decoded: {decoded}")
            except:
                print(f"Could not decode")

    idx += 1
