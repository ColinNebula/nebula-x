#!/usr/bin/env python3
"""Analyze actual triple-encoded patterns more carefully"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find specific corrupted text we saw
markers = [
    (b'REPLAY', "REPLAY button"),
    (b'Keyboard Ready', "Keyboard indicator"),
    (b'NEBULA X', "Copyright text"),
]

print("Analyzing corruption around key markers...\n")

for marker, desc in markers:
    pos = content.find(marker)
    if pos != -1:
        # Get 50 bytes before the marker
        start = max(0, pos - 50)
        before = content[start:pos]

        print(f"{desc}:")
        print(f"  50 bytes before '{marker.decode()}':")
        print(f"  {before}")
        print(f"  Hex: {before[-30:].hex()}")
        print()
