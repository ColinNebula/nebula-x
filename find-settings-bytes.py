#!/usr/bin/env python3
"""Find exact byte patterns for remaining corrupted Settings emojis"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    lines = f.readlines()

# Check line 19775 (Audio tab) - 0-indexed: 19774
print("Audio tab line:")
line = lines[19774]
print(line)
print(f"Hex: {line.hex()}")
print()

# Find the emoji bytes before "Audio"
audio_pos = line.find(b'Audio')
if audio_pos != -1:
    before_audio = line[audio_pos-30:audio_pos]
    print(f"Before 'Audio': {before_audio}")
    print(f"Hex: {before_audio.hex()}")
    print()

# Check line 19781 (Profile tab)
print("\nProfile tab line:")
line2 = lines[19780]
print(line2)
print()

profile_pos = line2.find(b'Profile')
if profile_pos != -1:
    before_profile = line2[profile_pos-20:profile_pos]
    print(f"Before 'Profile': {before_profile}")
    print(f"Hex: {before_profile.hex()}")
