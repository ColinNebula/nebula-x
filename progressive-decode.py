#!/usr/bin/env python3
"""Try more decoding steps to find the original emoji"""

corrupted = b'\xc3\x83\xc2\x83\xc3\x82\xc2\xb0\xc3\x83\xc2\x82\xc3\x82\xc2\x9f\xc3\x83\xc2\x82\xc3\x82\xc2\x8c\xc3\x83\xc2\x82\xc3\x82\xc2\x9f'

print("Trying progressive decoding...\n")

current = corrupted
for i in range(1, 6):
    try:
        current = current.decode('utf-8').encode('latin-1')
        try:
            as_utf8 = current.decode('utf-8')
            print(f"After {i} decode/encode cycles:")
            print(f"  Bytes: {current.hex()}")
            print(f"  As UTF-8: {as_utf8}")
            print(f"  As repr: {repr(as_utf8)}")

            # Check if it's a valid emoji range
            if current[0] in [0xe2, 0xe3, 0xf0]:
                print(f"  ✓ This looks like a valid emoji!")
                break
        except:
            print(f"After {i} cycles: {current.hex()} (not valid UTF-8)")
    except Exception as e:
        print(f"Failed at cycle {i}: {e}")
        break
