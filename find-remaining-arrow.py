#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find the arrow keys line
search_str = b'/ WASD - Move'
idx = content.rfind(search_str)  # Get the last occurrence (keyboard section)

if idx != -1:
    # Look backwards for the <p> tag
    start = content.rfind(b'<p>', idx - 200, idx)
    if start != -1:
        line = content[start:idx+len(search_str)]
        print(f"Found arrow keys line:")
        print(f"Text: {line}")
        print(f"\nHex: {line.hex()}\n")

        # Check for corruption
        if b'\xc3\x83' in line:
            # Find all corruption patterns
            i = 0
            while i < len(line):
                if line[i:i+2] == b'\xc3\x83':
                    # Extract the corrupted sequence
                    corrupted = b''
                    j = i
                    while j < len(line) and j < i + 50:
                        if line[j:j+2] in [b'\xc3\x83', b'\xc3\x82', b'\xc2\x82', b'\xc2\x83']:
                            corrupted += line[j:j+2]
                            j += 2
                        else:
                            break

                    if corrupted:
                        print(f"Corruption at position {i}: {corrupted}")
                        print(f"Hex: {corrupted.hex()}")
                        try:
                            decoded = corrupted.decode('utf-8')
                            print(f"Decoded: {decoded}\n")
                        except:
                            print("Could not decode\n")
                    i = j
                else:
                    i += 1
