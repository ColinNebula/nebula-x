#!/usr/bin/env python3
"""Extract exact recording emoji bytes"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    lines = f.readlines()

# Line 19027 (0-indexed: 19026)
line = lines[19026]
print("Line 19027:")
print(line)
print()

# Find the pattern between single quotes and 'RECORDING'
start = line.find(b"' ")
recording_pos = line.find(b" RECORDING")

if start != -1 and recording_pos != -1:
    emoji_bytes = line[start+2:recording_pos]
    print(f"Emoji bytes: {emoji_bytes}")
    print(f"Hex: {emoji_bytes.hex()}")
    print()

    # This looks like a mixed encoding pattern
    # Let me try different approaches

    # The hex shows: C3 83 C2 83 C3 82 C2 A2 C2 8F ... C2 B8 C2 8F
    # Notice the C2 8F patterns - those shouldn't be there in normal encoding

    # This might be:⏺️ (record button) = E2 8F BA EF B8 8F
    # Let's see if we can work backwards from what it SHOULD be

    correct_emoji = b'\xe2\x8f\xba\xef\xb8\x8f'  # ⏺️

    print(f"Should be: {correct_emoji.decode('utf-8')} ({correct_emoji.hex()})")
    print("\nApplying fix...")

    # Read full file
    with open(file_path, 'rb') as f:
        content = f.read()

    # Replace
    count = content.count(emoji_bytes)
    print(f"Found {count} instances")

    if count > 0:
        content = content.replace(emoji_bytes, correct_emoji)
        with open(file_path, 'wb') as f:
            f.write(content)
        print("✅ Fixed!")
