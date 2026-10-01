"""Validate served canonical pages, share images, crawl controls and configured redirects."""
import argparse, struct
import concurrent.futures, json, re, urllib.request, urllib.error, urllib.parse, xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base-url',default='http://localhost:3021')
parser.add_argument('--redirects',type=Path,required=True,help='JSON array exported from next.config redirects()')
parser.add_argument('--workers',type=int,default=1)
args=parser.parse_args()
BASE=args.base_url; ORIGIN='https://www.americantranslationservice.com'
class Head(HTMLParser):
 def __init__(self):super().__init__();self.canon=[];self.lang={};self.robots=[];self.ids=set();self.og={};self.twitter={}
 def handle_starttag(self,t,a):
  d=dict(a)
  if 'id' in d:self.ids.add(d['id'])
  if t=='link' and d.get('rel')=='canonical':self.canon.append(d.get('href'))
  if t=='link' and d.get('rel')=='alternate' and 'hreflang' in d:self.lang[d['hreflang']]=d.get('href')
  if t=='meta' and d.get('name')=='robots':self.robots.append(d.get('content',''))
  if t=='meta' and d.get('name','').startswith('twitter:'):self.twitter[d['name']]=d.get('content')
  if t=='meta' and d.get('property','').startswith('og:'):self.og[d['property']]=d.get('content')
def read(path):
 r=urllib.request.urlopen(urllib.request.Request(BASE+path,headers={'Accept-Language':'en','User-Agent':'Googlebot'}),timeout=40);s=r.read().decode(errors='replace');p=Head();p.feed(s);return r,p,s
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9','x':'http://www.w3.org/1999/xhtml'}
_,_,xml=read('/sitemap.xml');tree=ET.fromstring(xml);entries=tree.findall('s:url',ns);urls=[e.find('s:loc',ns).text for e in entries];assert len(urls)==len(set(urls))
def check_entry(e):
 u=e.find('s:loc',ns).text;assert u==ORIGIN or u.startswith(ORIGIN+'/'),u
 path=u[len(ORIGIN):] or '/';r,p,_=read(path)
 assert r.url==BASE+path,(path,r.url)
 assert p.canon==[u],(path,p.canon)
 assert not any('noindex' in x for x in p.robots),(path,p.robots)
 expected={x.attrib['hreflang']:x.attrib['href'] for x in e.findall('x:link',ns)}
 assert p.lang==expected,(path,p.lang,expected)
 assert p.og.get('og:url')==u,(path,p.og)
 image=p.og.get('og:image','');assert image.startswith(ORIGIN+'/share/'),(path,image)
 assert p.twitter.get('twitter:card')=='summary_large_image' and p.twitter.get('twitter:image')==image
 image_response=urllib.request.urlopen(BASE+image.removeprefix(ORIGIN),timeout=30);png=image_response.read()
 assert image_response.headers.get_content_type()=='image/png' and png[:8]==b'\x89PNG\r\n\x1a\n'
 assert struct.unpack('>II',png[16:24])==(1200,630)
 assert p.og.get('og:image:alt')==p.og.get('og:title')
 assert 'hreflang=' not in r.headers.get('Link',''),path
 return path
with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool: checked=list(pool.map(check_entry,entries))
assert len([u for u in urls if '/blog/' in u])==80
for pth in ['/zh/career','/es/career','/es/technical-translation','/es/interpretation','/es/general-translation','/es/notarization','/zh/blog/miami-foreign-credential-evaluation-services','/es/blog/miami-foreign-credential-evaluation-services']:
 _,p,_=read(pth);assert p.canon==[ORIGIN+pth[3:]],(pth,p.canon);assert any('noindex' in x for x in p.robots),pth;assert not p.lang,(pth,p.lang)
for pth in ['/payment/result','/zh/payment/result']:
 _,p,_=read(pth);assert any('noindex' in x for x in p.robots);assert not p.canon,p.canon
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
rules=json.loads(args.redirects.read_text());aliases=[(r['source'],r['destination']) for r in rules]
assert len(set(s for s,d in aliases))==len(aliases), 'Duplicate redirect sources'
for source,dest in aliases:
 try:opener.open(BASE+source+'?seo=check')
 except urllib.error.HTTPError as e:
  assert e.code==308,(source,e.code)
  loc=e.headers['Location'];parts=urllib.parse.urlsplit(loc);dp=urllib.parse.urlsplit(dest)
  assert parts.path==dp.path and parts.fragment==dp.fragment and 'seo=check' in parts.query,(source,loc,dest)
  r,p,_=read(loc if loc.startswith('/') else loc.removeprefix(BASE))
  if dp.fragment:assert dp.fragment in p.ids,(source,dp.fragment)
 else:raise AssertionError(source+' did not redirect')
_,_,robots=read('/robots.txt');assert 'Sitemap: '+ORIGIN+'/sitemap.xml' in robots
print(json.dumps({'sitemap_pages':len(checked),'blog_articles':80,'fallback_checks':8,'payment_result_checks':2,'redirect_checks':len(aliases),'sharing_images':len(checked),'canonical_alternates_og_robots':'passed'}))

# Historical content without a destination must be a real not-found response,
# never a homepage redirect or a successful blank page (soft 404).
inventory = json.loads((Path(__file__).resolve().parents[1] / 'content/seo/legacy-url-inventory.json').read_text())
missing = [r for r in inventory if r['status'] in {'review content', 'review asset', 'removed scope', 'retired endpoint', 'archive', 'internal source'}]
for row in missing:
 try: opener.open(BASE + row['path'])
 except urllib.error.HTTPError as error: assert error.code == 404, (row['path'], error.code)
 else: raise AssertionError(('Unexpected successful legacy response',row['path']))
print(f'Passed: {len(missing)} unmapped legacy paths are genuine 404s; review rows remain owner launch gates.')
