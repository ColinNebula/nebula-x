#!/usr/bin/env python3
"""Fix ALL remaining triple-encoded emojis in error messages and other locations"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
changes = []

# Build comprehensive list of ALL triple-encoded patterns we've found:

# The trick is: we already know ▶, ◀, etc work
# Now we need to find what ÃÂ°ÃÂÃÂÃÂ and ÃÂ¢ÃÂÃÂ decode to

# ÃÂ¢ÃÂÃÂ is likely a 3-byte emoji (E2 XX XX pattern) triple-encoded
# ÃÂ°ÃÂÃÂÃÂ is likely a 4-byte emoji (F0 9F XX XX pattern) triple-encoded

# Let me find ALL remaining patterns by extracting them:
import re

# Find all ÃÂ patterns
corrupted_sequences = set()
pos = 0
while True:
    pos = content.find(b'\xc3\x83', pos)
    if pos == -1:
        break
    # Get up to 40 bytes (max for a triple-encoded 4-byte emoji)
    seq = content[pos:pos+40]
    # Extract until we hit ASCII or end of corruption
    end = 0
    for i, byte in enumerate(seq):
        if byte < 0x80 and byte not in [0xc3, 0x82, 0x83]:  # Not part of mojibake
            end = i
            break
    if end > 0:
        corrupted_sequences.add(seq[:end])
    pos += 1

print(f"Found {len(corrupted_sequences)} unique corrupted sequences")
print("\nAnalyzing patterns...\n")

# Now let's decode what these SHOULD be by working backwards
def reverse_triple_encoding(triple_encoded):
    """Attempt to reverse triple encoding"""
    # Triple encoded: original → latin1 → utf8 → latin1 → utf8 → latin1 → utf8
    # To reverse: utf8 → latin1 → utf8 → latin1 → utf8 → latin1

    try:
        # Decode as UTF-8, interpret as Latin-1, repeat
        step1 = triple_encoded.decode('utf-8').encode('latin-1')
        step2 = step1.decode('utf-8').encode('latin-1')
        return step2
    except:
        return None

# Try to reverse each pattern
for seq in sorted(corrupted_sequences, key=len)[:15]:
    original = reverse_triple_encoding(seq)
    if original:
        try:
            emoji = original.decode('utf-8')
            # Only add if it's a valid emoji/symbol (has emoji or is special char)
            if ord(emoji[0]) > 127:
                print(f"Pattern: {seq[:20].hex()}")
                print(f"  → {original.hex()} ({emoji})")
                changes.append((seq, original))
        except:
            pass

# Apply all fixes
print(f"\nApplying {len(changes)} fixes...")
for corrupted, correct in changes:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        try:
            emoji = correct.decode('utf-8')
            print(f"  ✓ Fixed {count}x {emoji}")
        except:
            print(f"  ✓ Fixed {count}x (binary)")

if len(changes) > 0:
    with open(file_path, 'wb') as f:
        f.write(content)

    print(f"\n✅ Fixed {len(changes)} more emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes")
else:
    print("\n✅ No new patterns found")

# Final verification
mojibake_count = content.count(b'\xc3\x83')
print(f"\nFinal mojibake check: {mojibake_count} sequences remaining")
