#!/usr/bin/env python3
"""Cross-check a Google Search Console "Not found (404)" export against the sitemap URL sets.

Usage:  python3 -I xref-gsc.py gsc-404-urls.csv [--probe 3]

Input: a CSV or text file; the first URL-looking value on each line is used
(GSC: Page indexing > Not found (404) > Export). Output: URL counts per pattern
family, whether ANY URL is in before-urls.txt / after-urls.txt, and (with
--probe N) the live status of N sample URLs per family. Standard library only.
"""
import re, subprocess, sys, collections, pathlib
from urllib.parse import urlsplit

HERE = pathlib.Path(__file__).parent
FAMILIES = [
    ('web-pixels / wpm sandbox', re.compile(r'^/(web-pixels|wpm)[@\-]', re.I)),
    ('localized prefix (/en-ca/, /fr/ ...)', re.compile(r'^/[a-z]{2}(-[a-z]{2})?(/|$)', re.I)),
    ('collection-scoped product (/collections/x/products/y)', re.compile(r'^/collections/[^/]+/products/', re.I)),
    ('legacy blog (/blogs/...)', re.compile(r'^/blogs/', re.I)),
    ('/collections/all or other legacy collection', re.compile(r'^/collections/(all|vendors|types)(/|$)', re.I)),
    ('product file extension (.json/.js)', re.compile(r'^/products/[^/]+\.(json|js)$', re.I)),
    ('cart / checkout / account / auth', re.compile(r'^/(cart|checkouts?|account|authentication|services)(/|$)', re.I)),
    ('search', re.compile(r'^/search', re.I)),
    ('apps / app proxy', re.compile(r'^/(apps|a)/', re.I)),
    ('product', re.compile(r'^/products/', re.I)),
    ('collection', re.compile(r'^/collections/', re.I)),
    ('page / policy', re.compile(r'^/(pages|policies)/', re.I)),
]

def family(url):
    p = urlsplit(url)
    for name, rx in FAMILIES:
        if rx.search(p.path):
            return name + (' [with query]' if p.query else '')
    return 'other' + (' [with query]' if p.query else '')

def load(path):
    urls = []
    for line in open(path, encoding='utf-8', errors='ignore'):
        m = re.search(r'https?://[^\s,"\']+', line)
        if m: urls.append(m.group(0))
    return urls

def norm(url):
    # NOTE: the query string is kept on purpose: a parameterized URL is never a sitemap URL.
    p = urlsplit(url)
    return f'{p.scheme}://{p.netloc}{p.path}'.rstrip('/') + (f'?{p.query}' if p.query else '')

def status(url):
    out = subprocess.run(['curl', '-sS', '-m', '30', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}', url], capture_output=True, text=True).stdout
    return out.strip()

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    gsc = load(sys.argv[1])
    probe_n = int(sys.argv[sys.argv.index('--probe') + 1]) if '--probe' in sys.argv else 0
    before = {norm(u) for u in load(HERE / 'before-urls.txt')}
    after = {norm(u) for u in load(HERE / 'after-urls.txt')}
    groups = collections.defaultdict(list)
    for u in gsc:
        groups[family(u)].append(u)
    print(f'{len(gsc)} URLs read; {len(set(gsc))} unique\n')
    for name, items in sorted(groups.items(), key=lambda kv: -len(kv[1])):
        print(f'{len(items):6}  {name}')
    in_before = sorted({u for u in gsc if norm(u) in before})
    in_after = sorted({u for u in gsc if norm(u) in after})
    print(f'\nGSC 404 URLs present in the CURRENT sitemap set: {len(in_before)}')
    for u in in_before[:20]: print('   ', u)
    print(f'GSC 404 URLs present in the PROPOSED sitemap set: {len(in_after)}')
    for u in in_after[:20]: print('   ', u)
    if probe_n:
        print('\nLive status of samples per family:')
        for name, items in groups.items():
            for u in items[:probe_n]:
                print(f'  [{name}] {u} -> {status(u)}')

if __name__ == '__main__':
    main()
