#!/usr/bin/env python3
"""Find the actual emoji patterns (E2, E3, F0 ranges) that are triple-encoded"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

def reverse_triple_encoding(triple_encoded):
    """Reverse triple UTF-8 encoding"""
    try:
        step1 = triple_encoded.decode('utf-8').encode('latin-1')
        step2 = step1.decode('utf-8').encode('latin-1')
        return step2
    except:
        return None

# Find all remaining ÃÂ patterns with sufficient context
patterns_found = {}
pos = 0
while True:
    pos = content.find(b'\xc3\x83', pos)
    if pos == -1:
        break

    # Get context
    context_start = max(0, pos - 30)
    context_end = min(len(content), pos + 80)
    context = content[context_start:context_end]

    # Extract the corrupted sequence
    seq_start = pos - context_start
    seq = context[seq_start:]

    # Find end of corruption (when we hit normal ASCII)
    seq_end = 0
    for i in range(len(seq)):
        byte = seq[i]
        if i > 0 and byte < 0x80 and byte not in [0xc2, 0xc3, 0x82, 0x83]:
            seq_end = i
            break

    if seq_end > 10:  # Only interested in longer sequences (actual emojis)
        corrupted = seq[:seq_end]

        # Try to decode
        original = reverse_triple_encoding(corrupted)
        if original:
            # Check if it's in emoji range (E2, E3, or F0)
            if original[0] in [0xe2, 0xe3, 0xf0]:
                key = corrupted.hex()
                if key not in patterns_found:
                    try:
                        emoji = original.decode('utf-8')
                        patterns_found[key] = (corrupted, original, emoji)
                    except:
                        pass

    pos += 1

print(f"Found {len(patterns_found)} emoji patterns:\n")

fixes_to_apply = []
for hex_key, (corrupted, original, emoji) in sorted(patterns_found.items(), key=lambda x: x[1][2]):
    print(f"  {emoji} - {original.hex()}")
    fixes_to_apply.append((corrupted, original))

# Apply fixes
if fixes_to_apply:
    print(f"\nApplying {len(fixes_to_apply)} emoji fixes...")

    total_count = 0
    for corrupted, correct in fixes_to_apply:
        count = content.count(corrupted)
        total_count += count
        if count > 0:
            content = content.replace(corrupted, correct)
            emoji = correct.decode('utf-8')
            print(f"  ✓ Fixed {count}x {emoji}")

    if total_count > 0:
        with open(file_path, 'wb') as f:
            f.write(content)
        print(f"\n✅ Fixed {total_count} emoji instances!")

    # Check remaining
    remaining = content.count(b'\xc3\x83')
    print(f"\nRemaining mojibake: {remaining}")
else:
    print("\n✅ No emoji patterns found (already fixed)")
