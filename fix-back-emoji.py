#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Read the file as binary
with open('src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

original_size = len(content)

# Find the ASCII "?" that should be ◀ in the controls back button
# This is a simple replacement since it's plain ASCII
content = content.replace(
    b'className="back-button">\n              ? BACK',
    b'className="back-button">\n              \xe2\x97\x80 BACK'  # ◀
)
print(f"✅ Fixed ? → ◀ in Controls back button")

# Now find other corrupted emojis in that hint line
# Look for the corrupted pattern after "Press ↩"
search_context = b'Press \xe2\x86\xa9'  # "Press ↩"
idx = content.find(search_context)

if idx != -1:
    # Read context
    snippet = content[idx:idx+100]
    print(f"\nFound hint at position {idx}")
    print(f"Snippet: {snippet}")

    # Look for corruption pattern
    if b'\xc3\x83' in snippet:
        print("Found corruption in hint text")

# Write the fixed content
with open('src/components/SpaceShooter.jsx', 'wb') as f:
    f.write(content)

new_size = len(content)
saved = original_size - new_size

print(f"\n{'='*50}")
print(f"💾 File size: {original_size:,} → {new_size:,} bytes")
print(f"✨ Back button emoji fixed!")
