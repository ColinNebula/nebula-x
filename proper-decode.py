#!/usr/bin/env python3
"""Properly decode triple-encoded UTF-8"""

# The pattern we have:
corrupted = b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\x9f'

print(f"Corrupted (triple-encoded): {corrupted.hex()}")
print(f"As mojibake string: {corrupted.decode('utf-8')}")
print()

# To reverse triple encoding:
# The data went through: bytes → latin1 decode → utf8 encode → latin1 decode → utf8 encode
# So we reverse: utf8 decode → latin1 encode → utf8 decode → latin1 encode

try:
    step1 = corrupted.decode('utf-8')
    print(f"Step 1 (decode UTF-8): {step1}")
    print(f"  Bytes: {step1.encode('latin-1').hex()}")

    step2 = step1.encode('latin-1').decode('utf-8')
    print(f"Step 2 (latin-1 → UTF-8): {step2}")
    print(f"  Bytes: {step2.encode('latin-1').hex()}")

    step3 = step2.encode('latin-1')
    print(f"Step 3 (final bytes): {step3.hex()}")
    print(f"  As UTF-8: {step3.decode('utf-8')}")

except Exception as e:
    print(f"Error: {e}")

# Also try the other patterns we saw
print("\n" + "="*60)
print("Other patterns:\n")

other_patterns = [
    b'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x9a\xc3\x83\xc2\x82\xc3\x82\xc2\xa0',  # Should be part of ⚠
    b'\xc3\x83\xc2\x82\xc3\x82\xc2\xa9\xc3\x83\xc2\x82\xc3\x82\xc2\xa9',  # Should be ©
]

for pattern in other_patterns:
    try:
        decoded = pattern.decode('utf-8').encode('latin-1').decode('utf-8').encode('latin-1').decode('utf-8')
        print(f"{pattern[:20].hex()}... → {decoded}")
    except:
        print(f"{pattern[:20].hex()}... → (failed)")
