#!/usr/bin/env python3
"""Fix all remaining triple-encoded emojis with exact patterns"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# Exact patterns from the file:
replacements = [
    # 🎌 (crossed flags) - appears after LEVEL text
    # The pattern we found: C3 83 C2 83 C3 82 C2 B0 C3 83 C2 82 C3 82 C2 9F C3 83 C2 82 C3 82 C2 8C C3 83 C2 82 C3 82 C2 9F
    # This is incomplete - let me get the full sequence
    # Looking at the hex: it ends with C2 9F which suggests there's more
    # Let me try decoding what emoji ends with 8C 9F: 🎌 = F0 9F 8E 8C... but wait
    # Actually the pattern B0 9F 8C 9F suggests: F0 9F 8C 9F which is 🌟 (but that's 8C 9F)
    # Let's decode: B0 = F0 (first byte of 4-byte emoji)
    #                9F = 9F (second byte)
    #                8C = 8C (third byte - wait, or 8E?)
    # Let me work backwards from the mojibake we SEE: ÃÂ°ÃÂÃÂÃÂ

    # Actually, I should just use the reversal function
]

# Use systematic approach: find all triple-encoded sequences and reverse them
def reverse_triple(data):
    """Reverse UTF-8 → Latin-1 → UTF-8 → Latin-1 → UTF-8"""
    try:
        return data.decode('utf-8').encode('latin-1').decode('utf-8').encode('latin-1')
    except:
        return None

# Extract all mojibake sequences from the file
sequences = set()
pos = 0
while True:
    pos = content.find(b'\xc3\x83', pos)
    if pos == -1:
        break

    # Get sequence until we hit clean ASCII
    end = pos
    while end < len(content) and content[end] in [0xc2, 0xc3, 0x82, 0x83] + list(range(0x80, 0xc0)):
        end += 1

    seq = content[pos:end]
    if len(seq) >= 12:  # Emojis are at least 12 bytes when triple-encoded
        sequences.add(seq)

    pos = end + 1

print(f"Found {len(sequences)} unique triple-encoded sequences\n")

# Reverse each one and build replacement map
fixes = []
for seq in sequences:
    original = reverse_triple(seq)
    if original and len(original) >= 3:
        # Check if it's a valid emoji range
        if original[0] in [0xe2, 0xe3, 0xf0] or (original[0] == 0xc2 and len(original) == 2):
            try:
                char = original.decode('utf-8')
                # Only include if it's actually a visible character
                if ord(char[0]) >= 128:
                    fixes.append((seq, original, char))
                    print(f"Will fix: {char} ({original.hex()})")
            except:
                pass

# Apply fixes
total = 0
for corrupted, correct, char in fixes:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        total += count
        print(f"  ✓ Fixed {count}x {char}")

if total > 0:
    with open(file_path, 'wb') as f:
        f.write(content)

    print(f"\n✅ Fixed {total} triple-encoded emoji instances!")
    print(f"File size: {original_size} → {len(content)} bytes")

    remaining = content.count(b'\xc3\x83')
    print(f"\nRemaining mojibake: {remaining}")
else:
    print("\n✅ All emojis already fixed or no emoji patterns found")
