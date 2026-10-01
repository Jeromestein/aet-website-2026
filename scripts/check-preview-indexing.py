"""Check host-specific crawl protection against the existing local server."""
import argparse
from urllib.error import HTTPError
from urllib.request import Request, urlopen

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://localhost:3021')
args = parser.parse_args()
hosts = {
    'aet-website-2026.vercel.app': True,
    'aet-preview-owner.vercel.app': True,
    'www.americantranslationservice.com': False,
    'americantranslationservice.com': False,
    'localhost:3021': False,
    'vercel.app.example.com': False,
}
paths = ['/', '/zh/evaluation', '/es/institutions', '/robots.txt',
         '/sitemap.xml', '/share/en/index.png', '/not-a-real-page']
for host, noindex in hosts.items():
    for path in paths:
        request = Request(args.base_url.rstrip('/') + path, headers={
            'Host': host, 'Accept-Language': 'en',
        })
        try:
            response = urlopen(request, timeout=30)
        except HTTPError as error:
            response = error
        with response:
            assert response.status == (404 if path == '/not-a-real-page' else 200), (host, path, response.status)
            directives = response.headers.get('X-Robots-Tag', '').lower()
            assert ('noindex' in directives) == noindex, (host, path, directives)
print(f'Passed: {len(hosts) * len(paths)} host/path checks; Vercel aliases protected, official domains unchanged.')
