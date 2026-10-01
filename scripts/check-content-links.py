#!/usr/bin/env python3
"""Check imported body links; optionally crawl all locales and their local targets.

Requires beautifulsoup4. Run with --url http://localhost:3021 for HTTP checks.
Use --baseline /tmp/aet-body-before.json to also compare a prior body-text crawl.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, unquote
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
HOSTS = {'americantranslationservice.com', 'www.americantranslationservice.com'}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url')
parser.add_argument('--baseline', type=Path)
args = parser.parse_args()

def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)

def legacy(href):
    url = urlsplit(href)
    # External sharing/AI links can hide a legacy destination in encoded text.
    embedded_legacy = re.search(
        r'https?://(?:www\.)?americantranslationservice\.com/[^\s&]*\.(?:php|html)(?:[?#\s&]|$)',
        unquote(url.query), re.I)
    return embedded_legacy or url.hostname in HOSTS or (not url.scheme and not url.netloc and re.search(r'\.(?:php|html)$', url.path))

count = 0
for file in (ROOT / 'content').rglob('*.json'):
    for value in strings(json.loads(file.read_text())):
        if '<a' not in value:
            continue
        for a in BeautifulSoup(value, 'html.parser').select('a[href]'):
            assert not legacy(a['href']), (str(file.relative_to(ROOT)), a['href'])
            count += 1
print(f'Static: {count} imported HTML links checked; no old-host or PHP/HTML destinations.')
if not args.url:
    raise SystemExit(0)

base = args.url.rstrip('/')
paths = ['/', '/about', '/contact', '/institutions', '/pricing', '/evaluation',
         '/certified-translation', '/payment', '/blog', '/career',
         '/technical-translation', '/interpretation', '/expert-opinion-letters',
         '/general-translation', '/notarization']
paths += ['/offices/' + slug for slug in ['miami', 'boston', 'los-angeles', 'beijing']]
paths += ['/blog/' + a['slug'] for a in json.loads((ROOT / 'content/blog/articles.json').read_text())]
paths = [path if lang == 'en' else '/' + lang + (path if path != '/' else '')
         for path in paths for lang in ['en', 'zh', 'es']] + ['/privacy', '/terms']

def fetch(path):
    with urlopen(Request(base + path, headers={'Accept-Language': 'en'}), timeout=90) as response:
        assert response.status == 200, (path, response.status)
        assert urlsplit(response.url).path == urlsplit(base + path).path, (path, response.url)
        raw = response.read()
        if 'text/html' not in response.headers.get('Content-Type', ''):
            assert raw, path
            return {'path': path, 'ids': [], 'links': [], 'text': ''}
    soup = BeautifulSoup(raw, 'html.parser')
    main = soup.find('main')
    return {'path': path, 'ids': [node['id'] for node in soup.select('[id]')],
            'links': [a['href'] for a in main.select('a[href]')] if main else [],
            'text': main.get_text() if main else ''}

with ThreadPoolExecutor(max_workers=4) as pool:
    pages = list(pool.map(fetch, paths))
cache = {p['path']: p for p in pages}
checks = []
for page in pages:
    path = page['path']
    locale = re.match(r'^/(zh|es)(?:/|$)', path)
    for href in page['links']:
        assert not legacy(href), (path, href)
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        target = url.path or path
        assert target.startswith('/'), (path, href, 'relative link')
        # All HTML page links retain the current locale. Legal documents and
        # file downloads intentionally remain language-neutral.
        if url.path and not Path(url.path).suffix and url.path not in ['/privacy', '/terms']:
            target_locale = re.match(r'^/(zh|es)(?:/|$)', url.path)
            assert (locale[1] if locale else 'en') == (target_locale[1] if target_locale else 'en'), (path, href, 'locale')
        checks.append((path, href, target, unquote(url.fragment)))
missing = sorted({c[2] for c in checks} - cache.keys())
with ThreadPoolExecutor(max_workers=4) as pool:
    for page in pool.map(fetch, missing):
        cache[page['path']] = page
for source, href, target, fragment in checks:
    if fragment:
        assert fragment in cache[target]['ids'], (source, href, 'missing fragment')
if args.baseline:
    before = {r['path']: r for r in json.loads(args.baseline.read_text())}
    for page in pages:
        assert page['text'] == before[page['path']]['text'], (page['path'], 'body text changed')
    print('Body text is identical to the baseline on every page.')
print(f'HTTP: {len(pages)} pages, {len(checks)} local links, {len(cache)} unique page/file targets; locales and fragments passed.')
