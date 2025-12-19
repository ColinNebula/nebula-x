#!/usr/bin/env python3
"""Fix the partially triple-encoded variation selectors"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
changes = []

# The play button ▶️ is:
# ▶ (correctly encoded as E2 96 B6) + corrupted variation selector
# Variation selector FE0F (EF B8 8F in UTF-8) got triple-encoded to:
# C3 83 C2 83 C3 82 C2 AF C3 83 C2 82 C3 82 C2 B8 C3 83 C2 82 C3 82 C2 8F

replacements = [
    # ▶ followed by triple-encoded variation selector → ▶️
    (b'\xe2\x96\xb6\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f',
     b'\xe2\x96\xb6\xef\xb8\x8f'),  # ▶️
]

for corrupted, correct in replacements:
    count = content.count(corrupted)
    if count > 0:
        emoji = correct.decode('utf-8')
        changes.append(f"Fixed {count}x {emoji}")
        content = content.replace(corrupted, correct)
        print(f"✓ Replaced {count} instances of '{emoji}'")

if changes:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {len(changes)} more emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")

    # Now check for remaining mojibake
    mojibake_count = content.count(b'\xc3\x83\xc2\x83') + content.count(b'\xc3\x83\xc2\x82')
    print(f"\nRemaining potential issues: {mojibake_count}")
else:
    print("\n⚠️ Pattern not found")
