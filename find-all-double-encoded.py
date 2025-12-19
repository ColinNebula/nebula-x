import re

with open('./src/components/SpaceShooter.jsx', 'rb') as f:
    content = f.read()

# Find all double-encoded UTF-8 sequences (starts with \xc3\xb0 or \xc3\xa2)
# Pattern: \xc3[\x80-\xbf](\xc2[\x80-\xbf])+
pattern = rb'\xc3[\x80-\xbf](?:\xc2[\x80-\xbf])+'

matches = re.findall(pattern, content)
unique = set(matches)

print(f"Found {len(matches)} double-encoded sequences, {len(unique)} unique\n")

# Decode each to see what they should be
for seq in sorted(unique):
    try:
        # Try to decode as if it were mistakenly encoded as latin-1
        # The bytes represent UTF-8 that was read as latin-1 and re-encoded as UTF-8
        decoded = seq.decode('utf-8').encode('latin-1').decode('utf-8')
        print(f"{seq} → {decoded}")
    except:
        print(f"{seq} → (couldn't decode)")
