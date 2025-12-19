#!/usr/bin/env python3
"""Fix any remaining mojibake with varying encoding depths"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

def try_decode_n_times(data, max_cycles=5):
    """Try decoding up to N times to find the original"""
    for n in range(1, max_cycles + 1):
        try:
            result = data
            for _ in range(n):
                result = result.decode('utf-8').encode('latin-1')

            # Check if result is valid UTF-8 and in emoji/symbol range
            try:
                as_str = result.decode('utf-8')
                if len(as_str) > 0 and result[0] in [0xe2, 0xe3, 0xf0, 0xc2] and len(result) >= 2:
                    return (result, as_str, n)
            except:
                pass
        except:
            break
    return None

# Find ALL remaining mojibake
sequences = {}
pos = 0
while True:
    pos = content.find(b'\xc3\x83', pos)
    if pos == -1:
        break

    # Extract sequence
    end = pos
    while end < len(content) and content[end] in [0xc2, 0xc3, 0x82, 0x83] + list(range(0x80, 0xc0)):
        end += 1

    seq = content[pos:end]
    if len(seq) >= 8 and seq not in sequences:
        result = try_decode_n_times(seq)
        if result:
            correct_bytes, emoji, cycles = result
            sequences[seq] = (correct_bytes, emoji, cycles)

    pos = end if end > pos else pos + 1

print(f"Found {len(sequences)} more encoded sequences:\n")

# Group by encoding depth
by_depth = {}
for seq, (correct, emoji, cycles) in sequences.items():
    if cycles not in by_depth:
        by_depth[cycles] = []
    by_depth[cycles].append((seq, correct, emoji))

for depth in sorted(by_depth.keys()):
    print(f"\n{depth}x encoded ({len(by_depth[depth])} unique):")
    for seq, correct, emoji in sorted(by_depth[depth], key=lambda x: x[2])[:10]:
        print(f"  {emoji}")

# Apply all fixes
total = 0
for corrupted, (correct, emoji, cycles) in sequences.items():
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        total += count
        print(f"✓ {emoji} ({count}x, {cycles}x encoded)")

if total > 0:
    with open(file_path, 'wb') as f:
        f.write(content)

    print(f"\n✅ Fixed {total} more instances!")
    print(f"File size: {original_size} → {len(content)} bytes")

    remaining = content.count(b'\xc3\x83')
    print(f"\nRemaining: {remaining}")

    if remaining == 0:
        print("\n🎉🎉🎉 ALL MOJIBAKE ELIMINATED! 🎉🎉🎉")
else:
    print("\n✅ All deep-encoded emojis already fixed")
