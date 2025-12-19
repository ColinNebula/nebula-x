#!/usr/bin/env python3
"""Fix the recording button emoji using binary pattern matching"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find the exact corrupted pattern before "RECORDING"
pos = content.find(b' RECORDING')
if pos == -1:
    print("RECORDING not found")
    exit()

# Get the 30 bytes before it
before = content[pos-30:pos]
print(f"Before RECORDING: {before}")
print(f"Hex: {before.hex()}")

# Extract the corrupted emoji (between quote and space)
# The pattern should be: ' + corrupted_bytes + ' RECORDING'
quote_pos = before.rfind(b"'")
if quote_pos != -1:
    emoji_corrupted = before[quote_pos+1:]
    print(f"\nCorrupted emoji bytes: {emoji_corrupted}")
    print(f"Hex: {emoji_corrupted.hex()}")

    # Replace with ⏺️ (record button)
    correct_emoji = b'\xe2\x8f\xba\xef\xb8\x8f'

    # Build the replacement
    full_corrupted = b"'" + emoji_corrupted + b' RECORDING'
    full_correct = b"'\xe2\x8f\xba\xef\xb8\x8f RECORDING"

    print(f"\nReplacing:")
    print(f"  From: {full_corrupted}")
    print(f"  To: {full_correct}")

    count = content.count(full_corrupted)
    print(f"\nFound {count} instances")

    if count > 0:
        content = content.replace(full_corrupted, full_correct)

        with open(file_path, 'wb') as f:
            f.write(content)

        print("✅ Fixed recording button emoji!")
    else:
        print("⚠️ Pattern not found in file")
