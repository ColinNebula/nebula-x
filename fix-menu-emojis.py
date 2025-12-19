import codecs

with open('./src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

print("Fixing double-encoded emojis in menu...")

# Map of double-encoded bytes to proper emojis
fixes = [
    # Stats icons
    (b'\xc3\xb0\xc2\x9f\xc2\x8f\xc2\x86', '🏆'),  # Trophy
    (b'\xc3\xb0\xc2\x9f\xc2\x8c\xc2\x8a', '🌊'),  # Wave
    (b'\xc3\xb0\xc2\x9f\xc2\x92\xc2\xb0', '💰'),  # Money bag
    (b'\xc3\xa2\xc2\x8f\xc2\xb1\xc3\xaf\xc2\xb8\xc2\x8f', '⏱️'),  # Timer

    # Button icons
    (b'\xc3\xb0\xc2\x9f\xc2\x9a\xc2\x80', '🚀'),  # Rocket
    (b'\xc3\xa2\xc2\x96\xc2\xb6\xc3\xaf\xc2\xb8\xc2\x8f', '▶️'),  # Play
    (b'\xc3\xa2\xc2\xad\xc2\x90', '⭐'),  # Star
    (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xa8', '🎨'),  # Palette
    (b'\xc3\xa2\xc2\x9a\xc2\x99\xc3\xaf\xc2\xb8\xc2\x8f', '⚙️'),  # Gear
    (b'\xc3\xb0\xc2\x9f\xc2\x8e\xc2\xae', '🎮'),  # Game controller

    # Other menu emojis
    (b'\xc3\xa2\xc2\x80\xc2\xa2', '•'),  # Bullet point
    (b'\xc3\xb0\xc2\x9f\xc2\x94\xc2\xae', '🔮'),  # Crystal ball (for avatar fallback)
]

changes = 0
for old_bytes, new_emoji in fixes:
    count = content.count(old_bytes)
    if count > 0:
        content = content.replace(old_bytes, new_emoji.encode('utf-8'))
        changes += count
        print(f"✓ Fixed {count}x: {new_emoji}")

if changes > 0:
    with open('./src/components/SpaceShooter.jsx', 'wb') as f:
        f.write(content)
    print(f"\n✅ Fixed {changes} double-encoded emojis in menu!")
else:
    print("No double-encoded emojis found")
