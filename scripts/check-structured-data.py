"""Check served AET JSON-LD against Schema.org and visible page facts.

Uses the existing dev server; never starts a server or runs a production build.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
import urllib.request
from urllib.parse import urlsplit, parse_qs
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://localhost:3021')
parser.add_argument('--workers', type=int, default=4)
parser.add_argument('--vocabulary', type=Path, help='Optional cached Schema.org JSON-LD vocabulary')
args = parser.parse_args()
origin = 'https://www.americantranslationservice.com'
organization_id = origin + '/#organization'
root = Path(__file__).resolve().parents[1]
dates = json.loads((root / 'content/blog/dates.json').read_text())
dates.update({article['slug']: article['publishedAt'] for article in
              json.loads((root / 'content/blog/authored/articles.json').read_text())})


def fetch(url):
    request = urllib.request.Request(url, headers={'Accept-Language': 'en', 'User-Agent': 'Googlebot'})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode()


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.scripts, self.text, self.links, self.canonical = [], [], [], []
        self.script = None
        self.images = []
        self.hidden = 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'):
            self.hidden += 1
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.script = ''
        if tag == 'img':
            src = attrs.get('src', '')
            parsed = urlsplit(src)
            self.images.append(parse_qs(parsed.query).get('url', [src])[0] if parsed.path == '/_next/image' else src)
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))

    def handle_data(self, value):
        if self.script is not None:
            self.script += value
        elif not self.hidden:
            self.text.append(value)

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            assert '<' not in self.script, 'Unescaped HTML in JSON-LD'
            self.scripts.append(json.loads(self.script))
            self.script = None
        if tag in ('script', 'style'):
            self.hidden -= 1


vocabulary = json.loads(args.vocabulary.read_text() if args.vocabulary else fetch(
    'https://schema.org/version/latest/schemaorg-current-https.jsonld'))
terms = {node['@id']: node for node in vocabulary['@graph']}


def ids(value):
    return [item['@id'] for item in (value if isinstance(value, list) else [value]) if item]


def ancestors(term):
    result = {term}
    for parent in ids(terms.get(term, {}).get('rdfs:subClassOf', [])):
        result.update(ancestors(parent))
    return result


def validate(node, graph_ids):
    if isinstance(node, list):
        for item in node:
            validate(item, graph_ids)
    elif isinstance(node, dict):
        if set(node) == {'@id'}:
            assert node['@id'] in graph_ids, ('Unresolved entity', node['@id'])
        lineage = ancestors('schema:' + node['@type']) if '@type' in node else set()
        if '@type' in node:
            assert 'schema:' + node['@type'] in terms, ('Unknown type', node['@type'])
        for key, value in node.items():
            if not key.startswith('@'):
                term = terms.get('schema:' + key)
                assert term, ('Unknown property', key)
                domains = set(ids(term.get('schema:domainIncludes', [])))
                assert not lineage or lineage & domains, ('Wrong property domain', node.get('@type'), key)
                ranges = set(ids(term.get('schema:rangeIncludes', [])))
                for child in value if isinstance(value, list) else [value]:
                    if isinstance(child, dict) and '@type' in child:
                        assert ancestors('schema:' + child['@type']) & ranges, ('Wrong value type', key, child['@type'])
                validate(value, graph_ids)


namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [node.text for node in ET.fromstring(fetch(args.base_url + '/sitemap.xml')).findall('s:url/s:loc', namespace)]
services = {'evaluation', 'certified-translation', 'technical-translation', 'interpretation',
            'expert-opinion-letters', 'general-translation', 'notarization'}


def check(url):
    path = url[len(origin):] or '/'
    unlocalized = (path[3:] or '/') if path.startswith(('/zh/', '/es/')) or path in ('/zh', '/es') else path
    page = Page(fetch(args.base_url + path))
    assert page.scripts, (path, 'Missing JSON-LD')
    nodes = []
    for script in page.scripts:
        assert script['@context'] == 'https://schema.org'
        nodes.extend(script.get('@graph', [script]))
    graph_ids = {node['@id'] for node in nodes}
    assert len(graph_ids) == len(nodes), (path, 'Duplicate entity IDs')
    validate(nodes, graph_ids)
    types = [node['@type'] for node in nodes]
    assert types.count('BreadcrumbList') == int(unlocalized != '/'), (path, 'Breadcrumb coverage')
    assert types.count('BlogPosting') == int(unlocalized.startswith('/blog/')), (path, 'Article coverage')
    assert types.count('Service') == int(unlocalized[1:] in services), (path, 'Service coverage')
    if unlocalized == '/contact': assert types.count('LocalBusiness') == 6
    if unlocalized.startswith('/offices/'): assert types.count('LocalBusiness') == 1
    text = ' '.join(' '.join(page.text).split())
    for node in nodes:
        if node['@type'] == 'Organization':
            assert node['@id'] == organization_id
            assert node['foundingDate'] == '2009'
            assert not any('google.com/search' in link for link in node['sameAs'])
        elif node['@type'] == 'LocalBusiness':
            for phone in node['telephone']:
                assert 'tel:' + phone in page.links, (path, 'Invisible phone', phone)
            for email in node['email']:
                assert 'mailto:' + email in page.links, (path, 'Invisible email', email)
            if node['address']['addressCountry'] == 'US':
                assert node['address']['streetAddress'] in text, (path, 'Address drift')
            if node['@id'].endswith('beijing-office'):
                assert 'openingHoursSpecification' not in node, 'Invented Beijing hours'
        elif node['@type'] == 'BreadcrumbList':
            trail = node['itemListElement']
            assert len(trail) == (3 if unlocalized.startswith('/blog/') else 2)
            assert [item['position'] for item in trail] == list(range(1, len(trail) + 1))
            assert trail[-1]['item'] == page.canonical[0]
            assert trail[-1]['name'] in text, (path, 'Invisible breadcrumb title')
        elif node['@type'] == 'BlogPosting':
            assert node['headline'] in text
            language = 'zh-Hans' if path.startswith('/zh/') else 'es' if path.startswith('/es/') else 'en'
            assert node['url'] == page.canonical[0] and node['inLanguage'] == language
            if 'image' in node:
                assert node['image'].removeprefix(origin) in page.images, (path, 'Image absent from article')
            assert 'author' not in node and 'dateModified' not in node
            assert node.get('datePublished') == dates.get(unlocalized.split('/')[-1])
        elif node['@type'] == 'Service':
            assert node['url'] == page.canonical[0], (path, 'Service URL drift')
            assert node['name'] in text, (path, 'Invisible service name')
            for offer in node.get('offers', []):
                assert offer['name'] in text, (path, 'Invisible offer name', offer['name'])
                for part in offer['description'].split(' — '):
                    assert part in text, (path, 'Invisible price/qualification', part)
            if unlocalized == '/expert-opinion-letters':
                assert [offer['priceSpecification']['price'] for offer in node['offers']] == [620, 700, 800]
            if unlocalized == '/certified-translation':
                starting = node['offers'][0]['priceSpecification']
                assert starting['minPrice'] == 70 and 'price' not in starting
                assert 'priceSpecification' not in node['offers'][-1], 'Quote converted to fixed price'
            if unlocalized == '/interpretation':
                for offer in node['offers']:
                    price = offer['priceSpecification']
                    assert price['minPrice'] < price['maxPrice']
                    assert price['referenceQuantity']['unitText'] == 'hour'
    return 1


with ThreadPoolExecutor(max_workers=args.workers) as pool:
    marked_pages = sum(pool.map(check, urls))
for slug in services - {'evaluation', 'certified-translation', 'expert-opinion-letters'}:
    assert not Page(fetch(args.base_url + '/es/' + slug)).scripts, 'Fallback has duplicate service markup'
for path in ['/brand/aet-logo-header.png']:
    assert urllib.request.urlopen(args.base_url + path).status == 200
print(f'Passed: {len(urls)} sitemap pages; {marked_pages} JSON-LD pages; four untranslated fallbacks; logo asset.')
print('Checked Schema.org types/property domains/object ranges, references, visible contacts, prices and qualifications.')
print('This does not replace hosted Google Rich Results Test or Search Console validation.')
