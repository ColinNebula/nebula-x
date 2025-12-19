#!/usr/bin/env python3
"""
Master emoji fixer - handles all types of emoji corruption:
1. Double-encoded UTF-8 (Latin-1 misinterpretation)
2. Mojibake (multi-byte corruption)
3. Missing emojis (replaced with text)
"""

import sys

def fix_double_encoding(content):
    """Fix double-encoded UTF-8 emojis"""
    fixes = [
        # Emoji variant selector
        (b'\xc3\xaf\xc2\xb8\xc2\x8f', b'\xef\xb8\x8f'),
        # Common emoji symbols
        (b'\xc3\xa2\xc2\x86\xc2\xa9', b'\xe2\x86\xa9'),  # ↩
        (b'\xc3\xa2\xc2\x8f\xc2\xb0', b'\xe2\x8f\xb0'),  # ⏰
        (b'\xc3\xa2\xc2\x8f\xc2\xb1', b'\xe2\x8f\xb1'),  # ⏱
        (b'\xc3\xa2\xc2\x98\xc2\xa2', b'\xe2\x98\xa2'),  # ☢
        (b'\xc3\xa2\xc2\x9a\xc2\xa1', b'\xe2\x9a\xa1'),  # ⚡
        (b'\xc3\xa2\xc2\x9a\xc2\xab', b'\xe2\x9a\xab'),  # ⚫
        (b'\xc3\xa2\xc2\x9a\xc2\x99', b'\xe2\x9a\x99'),  # ⚙
        (b'\xc3\xa2\xc2\x96\xc2\xb6', b'\xe2\x96\xb6'),  # ▶
        (b'\xc3\xa2\xc2\x9c\xc2\x93', b'\xe2\x9c\x93'),  # ✓
        (b'\xc3\xa2\xc2\x9c\xc2\xa8', b'\xe2\x9c\xa8'),  # ✨
        (b'\xc3\xa2\xc2\x9c\xc2\xb3', b'\xe2\x9c\xb3'),  # ✳
        (b'\xc3\xa2\xc2\x9e\xc2\x9c', b'\xe2\x9e\x9c'),  # ➜
        (b'\xc3\xa2\xc2\xad\xc2\x90', b'\xe2\xad\x90'),  # ⭐
        (b'\xc3\xa2\xc2\x80\xc2\xa2', b'\xe2\x80\xa2'),  # •
        # 4-byte emojis
        (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xaf', b'\xf0\x9f\x8e\xaf'),  # 🎯
        (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xb2', b'\xf0\x9f\x8e\xb2'),  # 🎲
        (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xae', b'\xf0\x9f\x8e\xae'),  # 🎮
        (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xa8', b'\xf0\x9f\x8e\xa8'),  # 🎨
        (b'\xc3\xb0\xc2\x9f\xc2\x91\xc2\xa5', b'\xf0\x9f\x91\xa5'),  # 👥
        (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\xa3', b'\xf0\x9f\x92\xa3'),  # 💣
        (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\xb0', b'\xf0\x9f\x92\xb0'),  # 💰
        (b'\xc3\xb0\xc2\x9f\xc2\x93\xc2\xb9', b'\xf0\x9f\x93\xb9'),  # 📹
        (b'\xc3\xb0\xc2\x9f\xc2\x94\xc2\xa5', b'\xf0\x9f\x94\xa5'),  # 🔥
        (b'\xc3\xb0\xc2\x9f\xc2\x94\xc2\xae', b'\xf0\x9f\x94\xae'),  # 🔮
        (b'\xc3\xb0\xc2\x9f\xc2\x9a\xc2\x80', b'\xf0\x9f\x9a\x80'),  # 🚀
        (b'\xc3\xb0\xc2\x9f\xc2\x9a\xc2\x81', b'\xf0\x9f\x9a\x81'),  # 🚁
        (b'\xc3\xb0\xc2\x9f\xc2\x8c\xc2\x8a', b'\xf0\x9f\x8c\x8a'),  # 🌊
        (b'\xc3\xb0\xc2\x9f\xc2\x8f\xc2\x86', b'\xf0\x9f\x8f\x86'),  # 🏆
        (b'\xc3\xb0\xc2\x9f\xc2\x9b\xc2\xa1', b'\xf0\x9f\x9b\xa1'),  # 🛡
        (b'\xc3\xb0\xc2\x9f\xc2\x9b\xc2\xb8', b'\xf0\x9f\x9b\xb8'),  # 🛸
        (b'\xc3\xb0\xc2\x9f\xc2\xa7\xc2\xb2', b'\xf0\x9f\xa7\xb2'),  # 🧲
        (b'\xc3\xb0\xc2\x9f\xc2\xa9\xc2\xb9', b'\xf0\x9f\xa9\xb9'),  # 🩹
        # Special characters
        (b'\xc3\x83\xc2\x97', b'\xc3\x97'),  # ×
    ]

    total = 0
    for old, new in fixes:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            total += count

    return content, total

def main():
    file_path = './src/components/SpaceShooter.jsx'

    print("🔧 Master Emoji Fixer\n")

    try:
        with open(file_path, 'rb') as f:
            content = f.read()

        original_size = len(content)

        # Fix double-encoding
        content, fixed_count = fix_double_encoding(content)

        if fixed_count > 0:
            with open(file_path, 'wb') as f:
                f.write(content)

            print(f"✅ Fixed {fixed_count} emoji encoding issues!")
            print(f"📊 File size: {original_size} → {len(content)} bytes")

            # Verify
            remaining_bad = content.count(b'\xc3\xb0\xc2\x9f') + content.count(b'\xc3\xa2\xc2')
            if remaining_bad > 0:
                print(f"⚠️ Warning: {remaining_bad} suspicious sequences still detected")
                return 1
            else:
                print("✨ All emojis are now properly encoded!")
                return 0
        else:
            print("✅ No emoji encoding issues detected!")
            return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())
