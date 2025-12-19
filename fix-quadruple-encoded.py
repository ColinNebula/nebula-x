#!/usr/bin/env python3
"""Fix all QUADRUPLE-encoded emojis (yes, really!)"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

def quadruple_decode(data):
    """Decode data that's been encoded 4 times"""
    try:
        # Decode/encode 3 times
        result = data
        for _ in range(3):
            result = result.decode('utf-8').encode('latin-1')
        return result
    except:
        return None

# Find all unique mojibake sequences
sequences = {}
pos = 0
while True:
    pos = content.find(b'\xc3\x83', pos)
    if pos == -1:
        break

    # Extract the full sequence
    end = pos
    while end < len(content) and content[end] in [0xc2, 0xc3, 0x82, 0x83] + list(range(0x80, 0xc0)):
        end += 1

    seq = content[pos:end]
    if len(seq) >= 8:  # Minimum for a quadruple-encoded emoji
        if seq not in sequences:
            decoded = quadruple_decode(seq)
            if decoded and len(decoded) >= 2:
                # Check if it's in emoji range
                if decoded[0] in [0xe2, 0xe3, 0xf0, 0xc2]:
                    try:
                        emoji = decoded.decode('utf-8')
                        # Verify it's actually a useful character
                        if len(emoji) > 0 and ord(emoji[0]) >= 128:
                            sequences[seq] = (decoded, emoji)
                    except:
                        pass

    pos = end if end > pos else pos + 1

print(f"Found {len(sequences)} unique quadruple-encoded sequences:\n")

# Apply fixes
total_fixed = 0
for corrupted, (correct, emoji) in sorted(sequences.items(), key=lambda x: x[1][1]):
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        total_fixed += count
        print(f"✓ Fixed {count}x {emoji}")

if total_fixed > 0:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {total_fixed} quadruple-encoded emoji instances!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")

    # Final check
    remaining = content.count(b'\xc3\x83')
    print(f"\nRemaining mojibake: {remaining}")

    if remaining == 0:
        print("🎉 ALL EMOJIS FIXED!")
else:
    print("\n✅ No quadruple-encoded emojis found")
