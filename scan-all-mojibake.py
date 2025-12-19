#!/usr/bin/env python3
"""Scan for ALL remaining mojibake patterns"""

file_path = r'z:\Directory\projects\nebulax\src\components\SpaceShooter.jsx'

with open(file_path, 'rb') as f:
    content = f.read()

# Look for common mojibake byte signatures
mojibake_patterns = [
    b'\xc3\x83',  # Ã
    b'\xc3\x82',  # Â
    b'\xc3\xaf',  # ï
]

found_issues = []
for pattern in mojibake_patterns:
    pos = 0
    while True:
        pos = content.find(pattern, pos)
        if pos == -1:
            break

        # Get context
        start = max(0, pos - 30)
        end = min(len(content), pos + 50)
        context_bytes = content[start:end]

        try:
            context_str = context_bytes.decode('utf-8', errors='replace')
            # Only report if it looks like UI text (not random data)
            if any(word in context_str for word in ['btn', 'button', 'className', 'span', 'div', 'RESUME', 'PAUSE', 'BACK']):
                line_num = content[:pos].count(b'\n') + 1
                found_issues.append({
                    'line': line_num,
                    'context': context_str,
                    'bytes': context_bytes[:40].hex()
                })
        except:
            pass

        pos += 1

# Deduplicate and report
if found_issues:
    print(f"⚠️  Found {len(found_issues)} potential mojibake locations:\n")
    seen = set()
    for issue in found_issues[:20]:  # Show first 20
        key = (issue['line'], issue['context'][:50])
        if key not in seen:
            seen.add(key)
            print(f"Line {issue['line']}:")
            print(f"  Context: {issue['context'][:70]}")
            print()
else:
    print("✅ No mojibake patterns found!")
