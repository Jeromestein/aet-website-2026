"""Check legacy Visa prose and shared rendered prices against the running preview.

Requires BeautifulSoup. Does not start a server or change source files.
"""
import argparse
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from bs4 import BeautifulSoup

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://localhost:3021')
parser.add_argument('--legacy-root', type=Path, default=Path(__file__).resolve().parents[2] / 'server-54.213.58.23/americantranslationservice.com')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]

def fetch(path):
    with urlopen(Request(args.base_url + path, headers={'Accept-Language': 'en'}), timeout=60) as response:
        return BeautifulSoup(response.read(), 'html.parser')

def text(node):
    return re.sub(r'\s+', '', node.get_text())

for locale in ['en', 'zh', 'es']:
    prefix = '' if locale == 'en' else '/' + locale
    page = fetch(prefix + '/visa-service')
    pricing = fetch(prefix + '/pricing')
    content_locale = 'en' if locale == 'es' else locale
    content = json.loads((root / f'content/visa-service/{content_locale}.json').read_text())
    original = BeautifulSoup((args.legacy_root / content['source']).read_text(), 'html.parser')
    assert text(page.h1) == text(original.h1), (locale, 'title')
    for row in original.select('.main-content-with-sidebar > .row'):
        section_id = row.get('id', 'contact')
        for image in row.select('img'):
            image.parent.decompose()
        migrated = page.select_one('#' + section_id)
        for aside in migrated.select('aside'):
            aside.decompose()
        assert text(row) == text(migrated), (locale, section_id, 'source prose changed')
    page_tables = page.select('#price table')
    global_tables = pricing.select('#visa table')
    assert len(page_tables) == len(global_tables) == 3
    assert [text(t) for t in page_tables] == [text(t) for t in global_tables], locale
    assert len(page.select('#price tbody tr')) == 21
    assert '{{visa:' not in str(page), (locale, 'unresolved price')
    assert len(page.select('h1')) == 1
    ids = [tag['id'] for tag in page.select('[id]')]
    assert len(ids) == len(set(ids)), (locale, 'duplicate IDs')
    for a in page.select('a[href^="#"]'):
        assert a['href'][1:] in ids, (locale, a['href'])
    if locale == 'es':
        assert 'noindex' in page.select_one('meta[name="robots"]')['content']
        assert page.select_one('link[rel="canonical"]')['href'].endswith('/visa-service')
    for script in page.select('script[type="application/ld+json"]'):
        assert '{{visa:' not in script.string
        json.loads(script.string)
    print(f'{locale}: all 9 source sections preserved; 21 shared pricing rows match; anchors and metadata pass.')

for source, destination in [('/e-visaservice.php', '/visa-service'), ('/e-visaservice-zh.php', '/zh/visa-service'), ('/e_visaservice.html', '/visa-service'), ('/c_visaservice.html', '/zh/visa-service')]:
    try:
        response = urlopen(Request(args.base_url + source, headers={'Accept-Language': 'en'}), timeout=30)
    except HTTPError as response:
        assert response.code == 308, (source, response.code)
        assert response.headers['Location'] in [destination, args.base_url + destination], source
    else:
        assert response.url == args.base_url + destination, (source, response.url)
        response.close()
print('All 4 legacy Visa entry points reach the new localized pages.')
