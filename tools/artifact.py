#!/usr/bin/env python3
"""Tworzy wersję index.html do podglądu na claude.ai: usuwa bloki <!-- pwa:start -->…<!-- pwa:end -->
(doctype, head, body), bo podgląd dokłada własny szkielet strony.
Użycie: python3 tools/artifact.py index.html wynik.html"""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
s = re.sub(r'<!doctype html>\s*', '', s, count=1, flags=re.I)
s = re.sub(r'<!-- pwa:start.*?<!-- pwa:end -->\s*', '', s, flags=re.S)
open(dst, 'w', encoding='utf-8').write(s)
