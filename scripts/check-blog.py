#!/usr/bin/env python3
"""Check migrated blog HTML and optionally every local HTTP route and redirect.
Requires beautifulsoup4 and lxml. Use --url http://localhost:3021 for HTTP checks.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError
from urllib.parse import urlsplit
from concurrent.futures import ThreadPoolExecutor
import argparse, collections, hashlib, json, re

ROOT=Path(__file__).resolve().parents[1]
CATALOG=json.loads((ROOT/'content/blog/articles.json').read_text())
REPORT=json.loads((ROOT/'content/blog/migration-report.json').read_text())
PILOT='boston-foreign-credential-evaluation-services'
POSTS={p.stem:json.loads(p.read_text()) for p in (ROOT/'content/blog/posts').glob('*.json')}
assert set(POSTS)=={row['slug'] for row in CATALOG if row['slug']!=PILOT}
allowed={'div','p','h2','h3','h4','ul','ol','li','b','strong','em','i','u','a','img','br','table','thead','tbody','tr','th','td','blockquote','hr','span','sup','sub','details','summary','figure','figcaption'}

def normalized(value):return re.sub(r'\s+','',value)

def check_html(slug,body):
 soup=BeautifulSoup(body,'lxml')
 for tag in soup.body.find_all():
  assert tag.name in allowed,(slug,tag.name)
  assert not any(key.startswith('on') or key in ('style','srcdoc') for key in tag.attrs),(slug,tag)
  if tag.name=='a':assert tag.get('href','').startswith(('/', '#', 'https://', 'http://', 'mailto:', 'tel:')),(slug,tag)
 ids=[t['id'] for t in soup.find_all(id=True)]
 assert len(ids)==len(set(ids)),slug
 for a in soup.select('a[href^="#"]'):assert a['href'][1:] in ids,(slug,a['href'])
 assert not soup.select('a details, p figure, p details'), (slug, 'Invalid nested content')
 record=next(r for r in REPORT['articles'] if r['slug']==slug)
 assert len(soup.find_all('img'))==record['images'] and len(soup.find_all('table'))==record['tables'], slug
 for image in soup.find_all('img'):
  assert image.get('alt') and (ROOT/'public'/image['src'].lstrip('/')).exists(),(slug,image)
 for h in POSTS[slug]['toc']:assert h['id'] in ids,(slug,h)
 for generated in soup.select('figcaption, .source-archive > summary'):generated.decompose()
 expected=next(r for r in REPORT['articles'] if r['slug']==slug)['proseSha256']
 assert hashlib.sha256(normalized(soup.body.get_text()).encode()).hexdigest()==expected,slug

for slug,post in POSTS.items():check_html(slug,post['html'])
print('Static:', len(POSTS), 'complete English bodies, safe HTML, unique IDs, valid contents links and image files.')
parser=argparse.ArgumentParser();parser.add_argument('--url');parser.add_argument('--skip-redirects', action='store_true', help='Check routes/images separately when the preview has stale startup configuration');args=parser.parse_args()
if not args.url:raise SystemExit(0)
base=args.url.rstrip('/')

def fetch(path):
 with urlopen(Request(base+path,headers={'Accept-Language':'en'}),timeout=45) as response:
  return response.status,response.read()

def check_route(item):
 locale,row=item; prefix='' if locale=='en' else '/'+locale
 path=prefix+'/blog/'+row['slug'];status,raw=fetch(path)
 assert status==200,path
 soup=BeautifulSoup(raw,'lxml');assert len(soup.find_all('h1'))==1,path
 main=soup.select_one('main article');assert main is not None,path
 ids=[t['id'] for t in soup.find_all(id=True)];assert len(ids)==len(set(ids)),path
 for a in soup.select('main a[href^="#"]'):assert a['href'][1:] in ids,(path,a['href'])
 robots=soup.find('meta',attrs={'name':'robots'})
 assert (robots is not None and 'noindex' in robots.get('content',''))==(locale!='en'),path
 if row['slug']!=PILOT:
  expected=BeautifulSoup(POSTS[row['slug']]['html'],'lxml')
  assert normalized(main.get_text())==normalized(expected.body.get_text()),path
  assert soup.h1.get_text()==POSTS[row['slug']]['title'],path
 return path

with ThreadPoolExecutor(max_workers=4) as pool:
 routes=list(pool.map(check_route,[(locale,row) for locale in ['en','zh','es'] for row in CATALOG]))
print('HTTP:',len(routes),'article routes passed; English body parity, H1, noindex and anchors checked.')
assets=[asset['path'] for asset in REPORT['assets'].values()]+['/images/blog/boston-evaluation-sample.jpg','/images/blog/boston-reviews-archive.jpg']
with ThreadPoolExecutor(max_workers=4) as pool:
 for status,raw in pool.map(fetch,assets):assert status==200 and len(raw)>0
print('HTTP:',len(assets),'article images passed.')
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=build_opener(NoRedirect)
redirects=json.loads((ROOT/'content/blog/redirects.json').read_text())
def check_redirect(row):
 try:opener.open(base+row['source']+'?ref=migration-check',timeout=20)
 except HTTPError as e:
  assert e.code==308,(row,e.code)
  dest=urlsplit(e.headers['Location'])
  assert dest.path==row['destination'] and dest.query=='ref=migration-check',(row,dest)
 else:raise AssertionError(row)
if not args.skip_redirects:
 with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(check_redirect,redirects))
 print('HTTP:',len(redirects),'permanent legacy redirects passed with query preservation.')
else:
 print('HTTP: redirect verification skipped explicitly; verify separately on a freshly started server.')
for slug in ['not-a-real-blog-article','where-to-get-evaluation-for-uscis','boston-visa-application-process-services']:
 try:fetch('/blog/'+slug)
 except HTTPError as e:assert e.code==404,(slug,e.code)
 else:raise AssertionError(slug)
print('HTTP: unknown, excluded and held article slugs return 404.')
result={'articleRoutes':len(routes),'images':len(assets),'redirects':0 if args.skip_redirects else len(redirects),'redirectsSkipped':args.skip_redirects,'baseUrl':base,'invalidSlugs':3,'result':'passed'}
(ROOT/'output/playwright/blog-http-verification.json').write_text(json.dumps(result,indent=2)+'\n')
