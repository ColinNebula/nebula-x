#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find the corrupted hint text
search_str = b'Press \xe2\x86\xa9'  # "Press ↩"
idx = content.find(search_str)

while idx != -1:
    snippet = content[idx:idx+150]

    # Check if this has corruption
    if b'\xc3\x83' in snippet:
        print(f"\nFound corrupted hint at position {idx}")
        print(f"Full snippet: {snippet}")

        # Extract the corrupted bytes between the two ↩ symbols
        first_arrow = snippet.find(b'\xe2\x86\xa9')  # First ↩
        if first_arrow != -1:
            after_first = snippet[first_arrow+3:]  # After first ↩
            second_arrow = after_first.find(b' or')

            if second_arrow != -1:
                corrupted = after_first[:second_arrow]
                print(f"\nCorrupted bytes between '↩' and ' or': {corrupted}")
                print(f"Hex: {corrupted.hex()}")
                try:
                    print(f"Decoded: {corrupted.decode('utf-8')}")
                except:
                    pass

    idx = content.find(search_str, idx + 1)
