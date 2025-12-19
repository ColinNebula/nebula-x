#!/usr/bin/env python3
"""
MASTER EMOJI FIX - Comprehensive fix for all encoding levels
This applies ALL the fixes we discovered in order
"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

original_size = len(content)
all_fixes = []

print("="*70)
print("COMPREHENSIVE EMOJI FIX")
print("="*70)

# TRIPLE-ENCODED PATTERNS (most common)
print("\n[1/3] Fixing triple-encoded emojis...")

triple_encoded = [
    # Navigation arrows
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x97\xc3\x83\xc2\x82\xc3\x82\xc2\x80', b'\xe2\x97\x80'),  # ◀
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x96\xc3\x83\xc2\x82\xc3\x82\xc2\xb6', b'\xe2\x96\xb6'),  # ▶

    # Wing emoji
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x9c\xc3\x83\xc2\x82\xc3\x82\xc2\x88\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f', b'\xe2\x9c\x88\xef\xb8\x8f'),  # ✈️

    # Gamepad and buttons
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8e\xc3\x83\xc2\x82\xc3\x82\xc2\xae', b'\xf0\x9f\x8e\xae'),  # 🎮
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x86\xc3\x83\xc2\x82\xc3\x82\xc2\xa9', b'\xe2\x86\xa9'),  # ↩

    # Rocket (avatar fallback)
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x9a\xc3\x83\xc2\x82\xc3\x82\xc2\x80', b'\xf0\x9f\x9a\x80'),  # 🚀

    # Keyboard
    (b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\xa8\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f', b'\xe2\x8c\xa8\xef\xb8\x8f'),  # ⌨️

    # Play button with variation selector
    (b'\xe2\x96\xb6\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f', b'\xe2\x96\xb6\xef\xb8\x8f'),  # ▶️
]

triple_count = 0
for corrupted, correct in triple_encoded:
    count = content.count(corrupted)
    if count > 0:
        content = content.replace(corrupted, correct)
        triple_count += count
        emoji = correct.decode('utf-8')
        print(f"  ✓ {emoji} ({count}x)")

print(f"Fixed {triple_count} triple-encoded emojis")

# QUADRUPLE-ENCODED PATTERNS
print("\n[2/3] Fixing quadruple-encoded emojis...")

def quadruple_decode(data):
    try:
        result = data
        for _ in range(3):
            result = result.decode('utf-8').encode('latin-1')
        return result
    except:
        return None

quad_patterns = [
    # Level up star
    b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\x9f',
    # Music note
    b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8e\xc3\x83\xc2\x82\xc3\x82\xc2\xb5',
    # X mark (error)
    b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x9d\xc3\x83\xc2\x82\xc3\x82\xc2\x8c',
]

quad_count = 0
for pattern in quad_patterns:
    decoded = quadruple_decode(pattern)
    if decoded and pattern in content:
        count = content.count(pattern)
        content = content.replace(pattern, decoded)
        quad_count += count
        try:
            emoji = decoded.decode('utf-8')
            print(f"  ✓ {emoji} ({count}x)")
        except:
            print(f"  ✓ (binary) ({count}x)")

print(f"Fixed {quad_count} quadruple-encoded emojis")

# COPYRIGHT (double-encoded)
print("\n[3/3] Fixing double-encoded symbols...")
content = content.replace(b'\xc3\x83\xc2\x82\xc3\x82\xc2\xa9', b'\xc2\xa9')
print("  ✓ © (copyright)")

# Write result
with open(file_path, 'wb') as f:
    f.write(content)

size_diff = original_size - len(content)
total_fixed = triple_count + quad_count + 1

print("\n" + "="*70)
print(f"✅ COMPLETE! Fixed {total_fixed} emoji patterns")
print(f"File size: {original_size} → {len(content)} bytes (saved {size_diff} bytes)")
print("="*70)
