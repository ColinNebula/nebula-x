#!/usr/bin/env python3
"""Fix recording button - simpler approach"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# The corrupted pattern (including the partial triple-encoding)
corrupted_pattern = b"'Ã\x83\xc2\x83ÃÂºÃÂ¯ÃÂ¸Ã\x83\xc2\x82ÃÂ RECORDING'"

# Try the actual bytes we saw:
corrupted_bytes = b"'\xc3\x83\xc2\x83\xc3\x82\xc2\xa2\xc3\x83\xc2\x82\xc3\x82\xc2\x8f\xc3\x83\xc2\x82\xc3\x82\xc2\xba\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f RECORDING'"

correct_bytes = b"'\xe2\x8f\xba\xef\xb8\x8f RECORDING'"

print(f"Looking for pattern...")
print(f"Corrupted: {corrupted_bytes[:40].hex()}...")
print(f"Correct: {correct_bytes.hex()}")
print()

count = content.count(corrupted_bytes)
print(f"Found {count} instances")

if count > 0:
    content = content.replace(corrupted_bytes, correct_bytes)

    with open(file_path, 'wb') as f:
        f.write(content)

    print("✅ Fixed!")

    # Verify
    with open(file_path, 'rb') as f:
        new_content = f.read()

    if b"'\xe2\x8f\xba\xef\xb8\x8f RECORDING'" in new_content:
        print("✓ Verified: ⏺️ RECORDING is now correct!")
else:
    print("⚠️ Pattern not found - checking what's there...")

    # Find RECORDING and show what's before it
    pos = content.find(b' RECORDING')
    if pos != -1:
        show = content[pos-50:pos+15]
        print(f"\nActual bytes around RECORDING:")
        print(show)
