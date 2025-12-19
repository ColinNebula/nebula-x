#!/usr/bin/env python3
"""Show examples of what the remaining 177 mojibake sequences actually are"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find first 5 occurrences with full context
occurrences = []
pos = 0
for i in range(5):
    pos = content.find(b'\xc3\x83', pos)
    if pos == -1:
        break

    # Get lots of context
    start = max(0, pos - 100)
    end = min(len(content), pos + 100)
    context = content[start:end]
    line_num = content[:pos].count(b'\n') + 1

    try:
        context_str = context.decode('utf-8', errors='replace')
        occurrences.append((line_num, context_str))
    except:
        pass

    pos += 100  # Skip ahead to find different instances

print("First 5 occurrences of remaining mojibake:\n")
for line, context in occurrences:
    print(f"Line {line}:")
    print(context)
    print("\n" + "="*70 + "\n")

# Count by type
import re
whole_file = content.decode('utf-8', errors='replace')
mojibake_strings = re.findall(r'Ã[ÂÃ][€-ÿ][€-ÿ]+', whole_file)
from collections import Counter
most_common = Counter(mojibake_strings).most_common(10)

print("\n10 Most common mojibake strings:")
for string, count in most_common:
    print(f"  {count}x: {string}")
