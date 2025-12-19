#!/usr/bin/env python3
"""Fix the specific remaining corrupted emojis we identified"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)

# Specific patterns found:
replacements = [
    # Line 12775: Level up emoji (🎊 party popper)
    (b'\xc3\x83\xc2\x82\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8e\xc3\x83\xc2\x82\xc3\x82\xc2\x8a',
     b'\xf0\x9f\x8e\x8a'),  # 🎊

    # Error messages: ⚠️ warning
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x9a\xc3\x83\xc2\x82\xc3\x82\xc2\xa0\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f',
     b'\xe2\x9a\xa0\xef\xb8\x8f'),  # ⚠️

    # Recording button: ⏺️ record
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x8f\xc3\x83\xc2\x82\xc3\x82\xc2\xba\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8',
     b'\xe2\x8f\xba\xef\xb8\x8f'),  # ⏺️

    # Copyright: ©
    (b'\xc3\x83\xc2\x82\xc3\x82\xc2\xa9\xc3\x83\xc2\x82\xc3\x82\xc2\xa9',
     b'\xc2\xa9'),  # ©
]

changes = []
for corrupted, correct in replacements:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        try:
            emoji = correct.decode('utf-8')
            changes.append(f"{count}x {emoji}")
            print(f"✓ Fixed {count}x {emoji}")
        except:
            changes.append(f"{count}x (binary)")
            print(f"✓ Fixed {count}x (binary)")

if changes:
    with open(file_path, 'wb') as f:
        f.write(content)

    size_diff = original_size - len(content)
    print(f"\n✅ Fixed {len(changes)} more patterns!")
    print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")

    # Check remaining
    mojibake_count = content.count(b'\xc3\x83')
    print(f"\nRemaining mojibake sequences: {mojibake_count}")

    if mojibake_count > 0:
        # Show what's left
        print("\nChecking what remains...")
        pos = content.find(b'\xc3\x83')
        if pos != -1:
            line = content[:pos].count(b'\n') + 1
            context = content[pos-50:pos+50].decode('utf-8', errors='replace')
            print(f"Example at line {line}:")
            print(f"  {context}")
else:
    print("\n⚠️ No matches found - patterns may be different")
