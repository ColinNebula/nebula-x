#!/usr/bin/env python3
"""Find the gamepad and button emojis"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find "to confirm"
pos = content.find(b' to confirm')
if pos == -1:
    print("Not found")
    exit()

# Get 80 bytes before and 20 after
context = content[pos-80:pos+20]
print("Context around 'to confirm':")
print(context)
print("\nAs hex:")
print(context.hex())
print()

# Decode and show what we have
try:
    print("Trying to decode as UTF-8:")
    print(context.decode('utf-8', errors='replace'))
except:
    pass
