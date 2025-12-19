#!/usr/bin/env python3
"""Analyze the exact corruption pattern"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find WINGS
pos = content.find(b'WINGS')
if pos == -1:
    print("WINGS not found")
    exit()

# Get 100 bytes before WINGS
start = max(0, pos - 100)
before_wings = content[start:pos]

print("100 bytes before 'WINGS':")
print(before_wings)
print()
print("As hex:")
print(before_wings.hex())
print()

# Now find "BACK"
pos = content.find(b' BACK', start)
if pos != -1:
    before_back = content[pos-30:pos+10]
    print("\nAround 'BACK':")
    print(before_back)
    print("\nAs hex:")
    print(before_back.hex())

# Find "browse"
pos = content.find(b' to browse', start)
if pos != -1:
    before_browse = content[pos-40:pos+20]
    print("\nAround 'browse':")
    print(before_browse)
    print("\nAs hex:")
    print(before_browse.hex())
