#!/usr/bin/env python3
"""Direct byte-to-byte replacement for known mojibake patterns"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# I'll manually map the patterns we've seen:
# ÃÂ°ÃÂÃÂÃÂ at line 12775 should be some emoji
# Let me check what comes AFTER it in the original line

lines = content.split(b'\n')
line_12775 = lines[12774]

# Show the line
print("Current line 12775:")
print(line_12775.decode('utf-8', errors='replace'))
print()

# The line is: '🚀 LEVEL 🚀' + transition.level + ' ÃÂ°ÃÂÃÂÃÂ'
# This suggests the emoji after level number should match the theme
# Likely candidates: 🎊🎉🌟⭐✨

# Let me just grep for what emoji SHOULD be there by checking similar games
# But actually, let's just TRY each common "level up" emoji

level_emojis_to_try = {
    '🎊': b'\xf0\x9f\x8e\x8a',  # party popper
    '🎉': b'\xf0\x9f\x8e\x89',  # party
    '🌟': b'\xf0\x9f\x8c\x9f',  # glowing star
    '⭐': b'\xe2\xad\x90',      # star
    '✨': b'\xe2\x9c\xa8',      # sparkles
    '🏆': b'\xf0\x9f\x8f\x86',  # trophy
}

# Let me check which emoji's triple-encoding matches our pattern
target = b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\x9f'

def triple_encode(utf8_bytes):
    """Triple-encode UTF-8"""
    result = utf8_bytes
    for _ in range(2):  # Do it twice (double encoding = triple total)
        temp = b''
        for byte in result:
            if byte < 0x80:
                temp += bytes([byte])
            elif byte < 0xc0:
                temp += bytes([0xc2, byte])
            else:
                temp += bytes([0xc3, byte - 0x40])
        result = temp
    return result

print("Testing level emojis:")
for emoji_char, emoji_bytes in level_emojis_to_try.items():
    triple = triple_encode(emoji_bytes)
    if triple == target:
        print(f"  ✓ MATCH! {emoji_char} triple-encodes to our pattern")
        print(f"    {emoji_bytes.hex()} → {triple.hex()}")
    elif triple[:len(target)] == target or target[:len(triple)] == triple:
        print(f"  ~ PARTIAL: {emoji_char}")

print(f"\nTarget pattern: {target.hex()}")
print(f"Target length: {len(target)} bytes")
