#!/usr/bin/env python3
"""Fix remaining Audio tab emojis"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# Find the exact bytes for SFX and Test Sound
sfx_pos = content.find(b' SFX Volume')
if sfx_pos != -1:
    before_sfx = content[sfx_pos-30:sfx_pos]
    print(f"Before 'SFX Volume': {before_sfx}")
    print(f"Hex: {before_sfx.hex()}")
    print()

test_pos = content.find(b' Test Sound')
if test_pos != -1:
    before_test = content[test_pos-30:test_pos]
    print(f"Before 'Test Sound': {before_test}")
    print(f"Hex: {before_test.hex()}")
    print()

# These should be 🎵 (music note) or 🔊 (speaker)
# Based on the pattern, these are likely quadruple-encoded
# ÃÂ°ÃÂÃÂÃÂ suggests a 4-byte emoji starting with F0

# Let's try common audio emojis:
# 🔊 = F0 9F 94 8A (speaker)
# 🎵 = F0 9F 8E B5 (music note)
# 🔉 = F0 9F 94 89 (speaker medium)

replacements = [
    # SFX Volume - 🔉 speaker medium (quadruple-encoded)
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x94\xc3\x83\xc2\x82\xc3\x82\xc2\x89',
     b'\xf0\x9f\x94\x89', '🔉'),

    # Test Sound - 🔊 speaker (same pattern as Audio tab, already fixed)
    # But let me check if it's a different emoji
]

# Let me check what the exact bytes are
lines = content.split(b'\n')
for i, line in enumerate(lines):
    if b'SFX Volume' in line:
        print(f"Line {i+1} (SFX): {line}")
        print(f"Hex: {line.hex()}")
    if b'Test Sound' in line:
        print(f"Line {i+1} (Test): {line}")
        print(f"Hex: {line.hex()}")
