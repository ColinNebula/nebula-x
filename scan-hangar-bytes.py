#!/usr/bin/env python3
"""Scan customize overlay for corrupted emoji byte patterns"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find the customize overlay section (around lines 20400-20530)
# Each line is roughly 40-80 bytes, so line 20400 ≈ 20400*50 = 1,020,000 bytes
# But let's search for the section marker instead

customize_start = content.find(b'part-selector')
if customize_start == -1:
    print("Section not found")
    exit()

# Get 5000 bytes around this section
section = content[customize_start:customize_start+5000]

print("Scanning customize overlay section...")
print("=" * 60)

# Common corrupted patterns (first few bytes)
patterns_to_find = [
    (b'\xc3\x83\xc2\xa2', "ÃÂ¢ - likely corrupted arrow/symbol"),
    (b'\xc3\x83\xc2\xb0', "ÃÂ° - likely corrupted emoji start"),
    (b'\xc3\xa2\xc2\x97', "â— - corrupted triangle/arrow"),
    (b'\xc3\xa2\xc2\x96', "â– - corrupted square/arrow"),
]

for pattern, desc in patterns_to_find:
    count = section.count(pattern)
    if count > 0:
        print(f"\n Found {count}x: {desc}")
        print(f"  Pattern: {pattern}")

        # Find first occurrence and show context
        pos = section.find(pattern)
        if pos != -1:
            start = max(0, pos - 20)
            end = min(len(section), pos + 40)
            context = section[start:end]
            print(f"  Context: {context[:60]}")

            # Show the full corrupted sequence (up to 20 bytes)
            corrupted_seq = section[pos:pos+20]
            print(f"  Full sequence: {corrupted_seq}")

print("\n" + "=" * 60)
print("Looking for specific text markers...")

markers = [b'BACK', b'browse', b'WINGS', b'confirm']
for marker in markers:
    pos = section.find(marker)
    if pos != -1:
        start = max(0, pos - 30)
        end = min(len(section), pos + 30)
        context = section[start:end]
        print(f"\n{marker.decode()}: {context}")
