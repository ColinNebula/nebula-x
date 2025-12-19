#!/usr/bin/env python3
"""Fix ALL remaining triple-encoded UTF-8 in the entire file"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
changes = []

# Comprehensive list of triple-encoded emojis found in the file
# Format: (triple_encoded_bytes, correct_utf8)

replacements = [
    # ▶️ play button with variation selector (used in RESUME, REPLAY buttons)
    (b'\xe2\x96\xb6\xc3\x83\xc2\x82\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f', b'\xe2\x96\xb6\xef\xb8\x8f'),

    # ⌨️ keyboard emoji with variation selector
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\xa8\xc3\x83\xc2\x82\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f', b'\xe2\x8c\xa8\xef\xb8\x8f'),

    # © copyright symbol
    (b'\xc3\x83\xc2\x82\xc3\x82\xc2\xa9', b'\xc2\xa9'),

    # 🧑 person emoji (for avatar)
    (b'\xc3\x83\xc2\x82\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\xa7\xc3\x83\xc2\x82\xc3\x82\xc2\x91', b'\xf0\x9f\xa7\x91'),
]

# Apply replacements
for corrupted, correct in replacements:
    count = content.count(corrupted)
    if count > 0:
        try:
            emoji = correct.decode('utf-8')
            changes.append(f"Fixed {count}x {emoji}")
            content = content.replace(corrupted, correct)
            print(f"✓ Replaced {count} instances of '{emoji}'")
        except:
            changes.append(f"Fixed {count}x [binary pattern]")
            content = content.replace(corrupted, correct)
            print(f"✓ Replaced {count} instances of pattern")

# Write back
if changes:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {len(changes)} more emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")
    for change in changes:
        print(f"  • {change}")

    # Verify
    print("\n" + "="*60)
    print("Running verification...")

    # Count remaining mojibake
    mojibake_count = content.count(b'\xc3\x83')
    if mojibake_count > 0:
        print(f"⚠️  Still {mojibake_count} potential issues remaining")
    else:
        print("✓ No obvious mojibake patterns detected!")
else:
    print("\n⚠️ No matches found - patterns may be different than expected")
