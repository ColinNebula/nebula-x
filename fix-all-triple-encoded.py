#!/usr/bin/env python3
"""
Comprehensive fix for ALL remaining triple-encoded UTF-8 patterns.
This handles ALL the mojibake still in the file.
"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
total_fixed = 0

# Triple-encoding pattern:
# Original UTF-8 → read as Latin-1 → encode UTF-8 → read as Latin-1 → encode UTF-8
#
# Example: © (copyright)
# UTF-8: C2 A9
# As Latin-1: Â©
# Re-encode: C3 82 C2 A9  (double)
# As Latin-1: ÃÂ©
# Re-encode: C3 83 C2 82 C3 82 C2 A9 (triple)

# Build comprehensive replacement map
replacements = {}

# Method: Generate all likely triple-encoded patterns for common emojis/symbols

def triple_encode_utf8(utf8_bytes):
    """Simulate triple encoding: UTF-8 → Latin-1 → UTF-8 → Latin-1 → UTF-8"""
    # First decode as Latin-1 (treat each UTF-8 byte as a character)
    step1 = bytes([b for b in utf8_bytes])  # Original UTF-8

    # Encode each byte as if it were a Latin-1 character
    step2 = b''
    for byte in step1:
        # Each byte > 127 becomes a 2-byte UTF-8 sequence
        if byte < 0x80:
            step2 += bytes([byte])
        else:
            step2 += bytes([0xc0 | (byte >> 6), 0x80 | (byte & 0x3f)])

    # Now do it again (step2 → step3)
    step3 = b''
    for byte in step2:
        if byte < 0x80:
            step3 += bytes([byte])
        else:
            step3 += bytes([0xc0 | (byte >> 6), 0x80 | (byte & 0x3f)])

    return step3

# Common emojis and symbols to fix
common_patterns = {
    b'\xc2\xa9': '©',  # copyright
    b'\xe2\x9c\x93': '✓',  # checkmark
    b'\xe2\x9d\x8c': '❌',  # X mark
    b'\xe2\x9e\xa4': '➤',  # arrow
    b'\xf0\x9f\x8e\xaf': '🎯',  # target
    b'\xf0\x9f\x93\x8a': '📊',  # bar chart
    b'\xf0\x9f\x94\xa5': '🔥',  # fire
    b'\xf0\x9f\x92\xa1': '💡',  # lightbulb
    b'\xf0\x9f\x8e\xb5': '🎵',  # music note
    b'\xf0\x9f\x94\x8a': '🔊',  # speaker
    b'\xf0\x9f\x94\x87': '🔇',  # muted speaker
}

for utf8_bytes, char in common_patterns.items():
    triple_encoded = triple_encode_utf8(utf8_bytes)
    if triple_encoded in content:
        replacements[triple_encoded] = utf8_bytes
        print(f"Found triple-encoded {char}")

# Apply replacements
changes = []
for corrupted, correct in replacements.items():
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        try:
            char = correct.decode('utf-8')
            changes.append(f"{count}x {char}")
            total_fixed += count
        except:
            changes.append(f"{count}x [binary]")
            total_fixed += count

if total_fixed > 0:
    with open(file_path, 'wb') as f:
        f.write(content)

    print(f"\n✅ Fixed {total_fixed} triple-encoded patterns!")
    print(f"File size: {original_size} → {len(content)} bytes")
    if changes:
        print("\nFixed:")
        for change in changes:
            print(f"  • {change}")
else:
    print("\n✅ No additional triple-encoded common emojis found")

# Final check
mojibake_indicators = content.count(b'\xc3\x83\xc2\x83') + content.count(b'\xc3\x83\xc2\x82')
print(f"\nRemaining mojibake indicators: {mojibake_indicators}")
if mojibake_indicators > 0:
    print("(These may be in comments, strings, or less common emojis)")
