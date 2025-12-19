#!/usr/bin/env python3
"""
Fix ALL double-encoded UTF-8 emojis in the file.
Double-encoding happens when UTF-8 bytes are read as Latin-1 and re-encoded as UTF-8.
"""

with open('./src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

print("Fixing all double-encoded UTF-8 sequences...\n")

# Complete mapping of double-encoded bytes to proper characters
fixes = [
    # Emoji variant selector (often appears after emojis)
    (b'\xc3\xaf\xc2\xb8\xc2\x8f', b'\xef\xb8\x8f'),  # ️

    # Symbols
    (b'\xc3\xa2\xc2\x86\xc2\xa9', b'\xe2\x86\xa9'),  # ↩
    (b'\xc3\xa2\xc2\x8f\xc2\xb0', b'\xe2\x8f\xb0'),  # ⏰
    (b'\xc3\xa2\xc2\x98\xc2\xa2', b'\xe2\x98\xa2'),  # ☢
    (b'\xc3\xa2\xc2\x9a\xc2\xa1', b'\xe2\x9a\xa1'),  # ⚡
    (b'\xc3\xa2\xc2\x9a\xc2\xab', b'\xe2\x9a\xab'),  # ⚫
    (b'\xc3\xa2\xc2\x9c\xc2\x93', b'\xe2\x9c\x93'),  # ✓
    (b'\xc3\xa2\xc2\x9c\xc2\xa8', b'\xe2\x9c\xa8'),  # ✨
    (b'\xc3\xa2\xc2\x9c\xc2\xb3', b'\xe2\x9c\xb3'),  # ✳
    (b'\xc3\xa2\xc2\x9e\xc2\x9c', b'\xe2\x9e\x9c'),  # ➜

    # Emoji faces/objects
    (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xaf', b'\xf0\x9f\x8e\xaf'),  # 🎯
    (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xb2', b'\xf0\x9f\x8e\xb2'),  # 🎲
    (b'\xc3\xb0\xc2\x9f\xc2\x91\xc2\xa5', b'\xf0\x9f\x91\xa5'),  # 👥
    (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\xa3', b'\xf0\x9f\x92\xa3'),  # 💣
    (b'\xc3\xb0\xc2\x9f\xc2\x93\xc2\xb9', b'\xf0\x9f\x93\xb9'),  # 📹
    (b'\xc3\xb0\xc2\x9f\xc2\x94\xc2\xa5', b'\xf0\x9f\x94\xa5'),  # 🔥
    (b'\xc3\xb0\xc2\x9f\xc2\x9a\xc2\x81', b'\xf0\x9f\x9a\x81'),  # 🚁
    (b'\xc3\xb0\xc2\x9f\xc2\x9b\xc2\xa1', b'\xf0\x9f\x9b\xa1'),  # 🛡
    (b'\xc3\xb0\xc2\x9f\xc2\x9b\xc2\xb8', b'\xf0\x9f\x9b\xb8'),  # 🛸
    (b'\xc3\xb0\xc2\x9f\xc2\xa7\xc2\xb2', b'\xf0\x9f\xa7\xb2'),  # 🧲
    (b'\xc3\xb0\xc2\x9f\xc2\xa9\xc2\xb9', b'\xf0\x9f\xa9\xb9'),  # 🩹

    # Special characters (used in code, not visible emojis)
    (b'\xc3\x83\xc2\x97', b'\xc3\x97'),  # × (multiplication sign)
]

total_fixed = 0
for old_bytes, new_bytes in fixes:
    count = content.count(old_bytes)
    if count > 0:
        content = content.replace(old_bytes, new_bytes)
        total_fixed += count
        # Try to decode to show what it is
        try:
            emoji = new_bytes.decode('utf-8')
            print(f"✓ Fixed {count}x: {emoji}")
        except:
            print(f"✓ Fixed {count}x: {new_bytes.hex()}")

# Write back
with open('./src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

print(f"\n✅ Fixed {total_fixed} total double-encoded sequences!")

# Verify no more double-encoding remains
remaining = content.count(b'\xc3\xb0\xc2\x9f') + content.count(b'\xc3\xa2\xc2')
if remaining > 0:
    print(f"⚠️ Warning: {remaining} potential double-encoded sequences still remain")
else:
    print("✅ No double-encoded emoji sequences detected!")
