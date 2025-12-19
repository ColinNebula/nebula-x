#!/usr/bin/env python3
"""Fix ALL remaining triple-encoded emojis in customize overlay"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# Triple-encoded emoji patterns
replacements = [
    # 🎮 gamepad (triple-encoded, missing first part)
    # The full emoji is: 🎮 = F0 9F 8E AE
    # What we found: C3 82 C2 8E C3 83 C2 82 C3 82 C2 AE (partial triple encoding)
    # We need to find the full sequence by searching backwards
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8e\xc3\x83\xc2\x82\xc3\x82\xc2\xae', b'\xf0\x9f\x8e\xae'),

    # ↩ back arrow (triple-encoded)
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x86\xc3\x83\xc2\x82\xc3\x82\xc2\xa9', b'\xe2\x86\xa9'),
]

changes = []
for corrupted, correct in replacements:
    count = content.count(corrupted)
    if count > 0:
        emoji = correct.decode('utf-8')
        changes.append(f"Fixed {count}x {emoji}")
        content = content.replace(corrupted, correct)
        print(f"✓ Replaced {count} instances of {emoji}")

# Write back
if changes:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {len(changes)} more emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")
    for change in changes:
        print(f"  • {change}")
else:
    print("\n⚠️ No more triple-encoded emojis found!")

# Now let's check what's still corrupted
print("\n" + "="*60)
print("Checking for any remaining corruption...")

pos = content.find(b' to confirm')
if pos != -1:
    context = content[pos-80:pos+20]
    decoded = context.decode('utf-8', errors='replace')
    print(f"\nHint text: ...{decoded[-40:]}")

    # Check for mojibake
    if 'Â' in decoded or 'Ã' in decoded:
        print("⚠️  Still has mojibake - needs more investigation")
        print(f"\nRaw bytes:")
        print(context.hex())
    else:
        print("✓ Looks clean!")
