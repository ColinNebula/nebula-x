content = open('./src/components/SpaceShooter.jsx', 'rb').read()

# The corrupted byte sequence for shield emoji (double-encoded)
corrupted_shield = b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x9b\xc3\x83\xc2\x82\xc3\x82\xc2\xa1\xc3\x83\xc2\x83\xc3\x82\xc2\xaf\xc3\x83\xc2\x82\xc3\x82\xc2\xb8\xc3\x83\xc2\x82\xc3\x82\xc2\x8f'

# Proper shield emoji
proper_shield = '🛡️'.encode('utf-8')

count = content.count(corrupted_shield)
print(f"Found {count} corrupted shield emojis")

if count > 0:
    content = content.replace(corrupted_shield, proper_shield)
    open('./src/components/SpaceShooter.jsx', 'wb').write(content)
    print(f"✅ Fixed {count} double-encoded shield emojis!")
else:
    print("No corrupted shield emojis found")
