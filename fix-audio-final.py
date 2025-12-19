#!/usr/bin/env python3
"""Fix Audio tab SFX and Test Sound emojis"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# The pattern is the same for both: quadruple-encoded 🔊
# Pattern: C3 83 C2 83 C3 82 C2 B0 C3 83 C2 82 C3 82 C2 9F C3 83 C2 82 C3 82 C2 94 C3 83 C2 82 C3 82 C2 8A
# This is 🔊 (F0 9F 94 8A) that's been encoded 4 times

corrupted = b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x94\xc3\x83\xc2\x82\xc3\x82\xc2\x8a'
correct = b'\xf0\x9f\x94\x8a'  # 🔊

count = content.count(corrupted)
print(f"Found {count} instances of corrupted 🔊")

if count > 0:
    content = content.replace(corrupted, correct)

    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {count}x 🔊 (SFX & Test Sound)")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")
else:
    print("⚠️ Pattern not found")
