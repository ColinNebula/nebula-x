#!/usr/bin/env python3
"""Fix ALL triple-encoded emojis with correct byte patterns"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
original_content = content
changes = []

# All triple-encoded patterns we found:
# The pattern is: UTF-8 → Latin-1 → UTF-8 → Latin-1 → UTF-8 (triple encoding)

replacements = [
    # ⌨️ keyboard with variation selector (found before "Keyboard Ready")
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\xa8\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f',
     b'\xe2\x8c\xa8\xef\xb8\x8f'),  # ⌨️
]

# First, let me check what variation selector patterns exist
# The ▶️ button corruption might be different
pos = content.find(b'RESUME')
if pos != -1:
    before_resume = content[pos-50:pos]
    print("Before RESUME:")
    print(before_resume)
    print("Hex:", before_resume[-30:].hex())
    print()

pos = content.find(b'REPLAY')
if pos != -1:
    # Find the button content before REPLAY
    # Search backwards for btn-icon or similar
    search_start = max(0, pos - 200)
    section = content[search_start:pos+20]
    print("Section around REPLAY:")
    print(section)
    print()

# Apply known replacements first
for corrupted, correct in replacements:
    count = content.count(corrupted)
    if count > 0:
        emoji = correct.decode('utf-8')
        changes.append(f"Fixed {count}x {emoji}")
        content = content.replace(corrupted, correct)
        print(f"✓ Replaced {count} instances of '{emoji}'")

# Check for any differences
if content != original_content:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {len(changes)} emoji patterns!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")
else:
    print("\n⚠️ No changes made - investigating patterns...")
