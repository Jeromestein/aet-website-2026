"""Render static AET sharing cards from the served canonical page titles.

Requires Pillow. Uses the existing preview; never starts it.
Chinese rendering uses a caller-supplied font (rasterized, never redistributed).
"""
import argparse
from pathlib import Path
import re
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url', default='http://localhost:3021')
parser.add_argument('--font', default='/System/Library/Fonts/Supplemental/Arial Bold.ttf')
parser.add_argument('--cjk-font', default='/Library/Fonts/Arial Unicode.ttf')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
origin = 'https://www.americantranslationservice.com'

def fetch(path):
    req = urllib.request.Request(args.base_url + path, headers={'User-Agent': 'Googlebot', 'Accept-Language': 'en'})
    return urllib.request.urlopen(req, timeout=60).read().decode()

class Metadata(HTMLParser):
    def __init__(self, html):
        super().__init__(); self.title = None; self.feed(html)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta' and a.get('property') == 'og:title': self.title = a['content']

logo = Image.open(root / 'public/brand/aet-logo-header.png').convert('RGBA')
logo.thumbnail((460, 110), Image.Resampling.LANCZOS)
urls = [n.text for n in ET.fromstring(fetch('/sitemap.xml')).findall('{*}url/{*}loc')]
for url in urls:
    path = url.removeprefix(origin) or '/'
    match = re.match(r'^/(zh|es)(/|$)', path)
    locale = match[1] if match else 'en'
    route = (path[3:] or '/') if match else path
    title = Metadata(fetch(path)).title
    assert title, path
    canvas = Image.new('RGB', (1200, 630), '#EAF4FC'); draw = ImageDraw.Draw(canvas)
    canvas.paste(logo, (70, 46), logo)
    draw.rectangle((70, 198, 142, 205), fill='#C7471D')
    for size in range(60, 27, -1):
        face = ImageFont.truetype(args.cjk_font if locale == 'zh' else args.font, size)
        tokens = list(title) if locale == 'zh' else title.split()
        lines = ['']; separator = '' if locale == 'zh' else ' '
        for token in tokens:
            candidate = (lines[-1] + separator + token).strip()
            if draw.textlength(candidate, font=face) > 1050 and lines[-1]: lines.append(token)
            else: lines[-1] = candidate
        if len(lines) * (size + 12) <= 275 and all(draw.textlength(line, font=face) <= 1050 for line in lines): break
    else: raise ValueError(f'Title does not fit: {path}')
    for i, line in enumerate(lines): draw.text((70, 240 + i*(size+12)), line, font=face, fill='#18334E')
    draw.line((70, 548, 1130, 548), fill='#D9E5EF', width=2)
    small = ImageFont.truetype(args.font, 22)
    draw.text((70, 575), 'americantranslationservice.com', font=small, fill='#5B6D7E')
    target = root / 'public/share' / locale / (route.strip('/') + '.png' if route != '/' else 'index.png')
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target, optimize=True)
print(f'Rendered {len(urls)} page-specific 1200 × 630 PNG cards.')
