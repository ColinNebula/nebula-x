#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find the Keyboard section
search_str = b'Keyboard</h3>'
idx = content.find(search_str)

if idx != -1:
    # Read the controls-info section
    snippet = content[idx:idx+1000]

    print("Keyboard section found")
    print(f"Snippet (first 500 bytes): {snippet[:500]}\n")

    # Find the arrow keys line
    arrow_line_start = snippet.find(b'<p>')
    arrow_line_end = snippet.find(b'/ WASD')

    if arrow_line_start != -1 and arrow_line_end != -1:
        arrow_text = snippet[arrow_line_start:arrow_line_end]
        print(f"Arrow keys line: {arrow_text}")
        print(f"Hex: {arrow_text.hex()}\n")

    # Find Laser Beam line
    laser_start = snippet.find(b'L - Laser Beam')
    if laser_start != -1:
        laser_snippet = snippet[laser_start:laser_start+100]
        print(f"Laser Beam line: {laser_snippet}")
        print(f"Hex: {laser_snippet.hex()}\n")

# Find PlayStation section
ps_search = b'PlayStation</h3>'
idx = content.find(ps_search)

if idx != -1:
    snippet = content[idx:idx+500]
    print("\nPlayStation section found")
    print(f"Snippet: {snippet[:300]}\n")

    # Find all lines with corrupted button symbols
    lines = snippet.split(b'<p>')
    for i, line in enumerate(lines[:10]):
        if b'\xc3\x83' in line:  # Corruption pattern
            print(f"Corrupted line {i}: {line[:80]}")
            print(f"Hex: {line[:80].hex()}\n")
