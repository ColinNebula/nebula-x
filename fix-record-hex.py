#!/usr/bin/env python3
"""Fix recording button - hex only"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# The exact bytes we found: C3 83 C2 83 C3 82 C2 A2 + more
# Full corrupted sequence from the inspection:
# From quote (') to space before RECORDING

corrupted_hex = '27c383c283c382c2a2c383c282c382c28fc383c282c382c2bac383c283c382c2afc383c282c382c2b8c383c282c382c28f205245434f5244494e4727'
corrupted_bytes = bytes.fromhex(corrupted_hex)

correct_hex = '27e28fbaefb88f205245434f5244494e4727'
correct_bytes = bytes.fromhex(correct_hex)

print(f"Corrupted pattern ({len(corrupted_bytes)} bytes):")
print(f"  {corrupted_bytes}")
print(f"\nCorrect pattern ({len(correct_bytes)} bytes):")
print(f"  {correct_bytes.decode('utf-8')}")
print()

count = content.count(corrupted_bytes)
print(f"Found {count} instances")

if count > 0:
    content = content.replace(corrupted_bytes, correct_bytes)
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    print("✅ Fixed recording button!")
else:
    print("⚠️ Pattern not found")
