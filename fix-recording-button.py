#!/usr/bin/env python3
"""Fix the recording button emoji specifically"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find the exact pattern
pos = content.find(b'RECORDING')
if pos != -1:
    before = content[pos-50:pos]
    print("Before 'RECORDING':")
    print(before)
    print(f"\nHex: {before.hex()}")

    # The corrupted emoji should be right before 'RECORDING'
    # Let's extract it
    emoji_end = before.rfind(b' ')
    if emoji_end != -1:
        emoji_bytes = before[emoji_end+1:]
        print(f"\nCorrupted emoji bytes: {emoji_bytes.hex()}")

        # Try decoding it
        for n in range(1, 6):
            try:
                result = emoji_bytes
                for _ in range(n):
                    result = result.decode('utf-8').encode('latin-1')
                emoji = result.decode('utf-8')
                print(f"{n}x decode: {emoji} ({result.hex()})")
                if result[0] in [0xe2, 0xe3, 0xf0]:
                    print(f"  ✓ Found it! Recording button: {emoji}")

                    # Apply fix
                    content = content.replace(emoji_bytes, result)
                    with open(file_path, 'wb') as f:
                        f.write(content)
                    print(f"\n✅ Fixed recording button!")
                    break
            except:
                pass
