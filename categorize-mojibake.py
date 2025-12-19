#!/usr/bin/env python3
"""Find WHERE the remaining mojibake bytes are located"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Find all mojibake byte sequences and their contexts
mojibake_pattern = b'\xc3\x83'
positions = []

pos = 0
while True:
    pos = content.find(mojibake_pattern, pos)
    if pos == -1:
        break
    positions.append(pos)
    pos += 1

# Group by context (get line number and surrounding text)
contexts = {}
for pos in positions[:10]:  # Check first 10
    line_num = content[:pos].count(b'\n') + 1

    # Get surrounding text
    start = max(0, pos - 60)
    end = min(len(content), pos + 60)
    context = content[start:end]

    try:
        context_str = context.decode('utf-8', errors='replace')
        # Categorize
        if '//' in context_str or '/*' in context_str or '*/' in context_str:
            category = "COMMENT"
        elif 'className' in context_str or '<' in context_str:
            category = "JSX/HTML"
        elif 'const' in context_str or 'let' in context_str or '=' in context_str:
            category = "CODE"
        else:
            category = "UNKNOWN"

        key = (category, line_num)
        if key not in contexts:
            contexts[key] = context_str[:80]
    except:
        pass

print(f"Found {len(positions)} mojibake byte sequences\n")
print("First 10 contexts:")
for (category, line), context in sorted(contexts.items())[:10]:
    print(f"\n[{category}] Line {line}:")
    print(f"  {context}")
