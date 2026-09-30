#!/usr/bin/env python3
"""Import the retained legacy articles. Requires beautifulsoup4, lxml and Pillow.

Usage: python3 scripts/migrate-blog.py [--check]
This is an offline, allowlisted migration; it never fetches or executes legacy code.
"""
from pathlib import Path
from datetime import datetime
from bs4 import BeautifulSoup, Comment
from PIL import Image
from urllib.parse import urlsplit, urljoin, unquote
import collections, hashlib, html, json, re, sys

ROOT = Path(__file__).resolve().parents[1]
LEGACY = ROOT.parent / 'server-54.213.58.23/americantranslationservice.com'
CHECK = '--check' in sys.argv
CATALOG = json.loads((ROOT / 'content/blog/articles.json').read_text())
PILOT = 'boston-foreign-credential-evaluation-services'
# The separately maintained Boston pilot has no date in its source.
DATES = {PILOT: None}
SLUGS = {row['slug'] for row in CATALOG}
OUT = ROOT / 'content/blog/posts'
ASSETS = ROOT / 'public/images/blog/legacy'
ORIGIN = 'https://www.americantranslationservice.com'
REPORT = {'articles': [], 'assets': {}, 'unlinkedExcludedArticles': [], 'titleDifferences': [], 'missingAssets': [], 'repairedFragments': [], 'repairedIds': []}
BIOGRAPHY_REVIEW = json.loads((ROOT / 'content/blog/biography-review.json').read_text())
# Historical selection aliases; reviewed biography exceptions below are allowed.
# This is not a statement of AICE policy or a live membership lookup.
BLOCKED = re.compile(r'\bNACES\b|National Association of Credential Evaluation Services|Academic Evaluation Services|Center for Educational Documentation|Center for Applied Research.{0,10}Evaluation|Educational Credential Evaluators|Educational Perspectives|Educational Records Evaluation Service|Foreign Academic Credential Service|Foundation for International Services|Global Credential Evaluators|Globe Language Services|Institute of Foreign Credential Services|International Consultants of Delaware|International Education Evaluations|International Education Research Foundation|Josef Silny|JS&A|The Evaluation Company|SpanTran|Transcript Research|World(?:wide)? Education Services|\b(?:WES|ECE|IERF|IEE)\b|naces\.org|aes-edu\.org|cedevaluations\.com|iescaree\.com|ece\.org|edperspective\.org|eres\.com|facsusa\.com|fis-web\.com|gceus\.com|globelanguage\.com|ifcsevals\.com|icdeval\.com|myiee\.org|iee123\.org|ierf\.org|jsilny\.(?:com|org)|evalcompany\.com|spantran\.com|transcriptresearch\.com|wes\.org', re.I)
SERVICE_PATHS = {
 '/': '/', '/home.php': '/', '/e_notarized.html': '/certified-translation',
 '/e-expert-opinion-letter.html': '/expert-opinion-letters', '/english.html': '/',
 '/e_translation.html': '/general-translation', '/down/applicationform.pdf': '/down/applicationform.pdf',
 '/e-notarized.php': '/certified-translation', '/e_contact.html': '/contact',
 '/e-contact.php': '/contact', '/e_evaluation.html': '/evaluation',
 '/e-evaluation.php': '/evaluation', '/e-expert-opinion-letter.php': '/expert-opinion-letters',
 '/los-angeles-office.html': '/contact#la', '/miami-office.html': '/contact#miami',
 '/san-francisco-office.html': '/contact#sf',
}
# Actual image contents were reviewed on contact sheets; legacy "Office" alt text
# was often incorrect for report, event and review images.
IMAGE_TEXT = {
 '944.jpg': 'Passport and permanent resident card', 'AET Trans.jpg': 'Credential evaluation and translation promotional illustration',
 'Boston-1.jpg': 'Historical 2016 Yelp recognition', 'Boston1.jpg': 'Building exterior from the original Boston article',
 'Boston10.jpg': 'Two people at an event in the original article', 'Boston11.jpg': 'Historical Google review screenshot',
 'Boston13.jpg': 'Historical credential evaluation report sample', 'Boston14.jpg': 'Meeting around a conference table',
 'Boston2.jpg': 'Historical Yelp search results', 'Boston3.jpg': 'Building exterior from the original Boston article',
 'Boston4.jpg': 'Historical credential evaluation report sample', 'Boston5.jpg': 'Building exterior from the original Boston article',
 'Boston6.jpg': 'Office interior from the original article', 'Boston7.jpg': 'Group photograph from the original article',
 'Boston8.jpg': 'Historical Yelp search results', 'Boston9.jpg': 'Meeting around a conference table',
 'CA.jpg': 'Street scene in Los Angeles', 'EOL.jpg': 'Expert opinion letter promotional illustration',
 'LAWindowOffice2.jpg': 'Office meeting room overlooking palm trees', 'Miami-Immigrants.png': 'Illustration of people with an American flag',
 'Miami1.jpg': 'Building exterior from the original Miami article', 'Miami5.jpg': 'Shelves containing office files',
 'Miami6.jpg': 'Office entrance from the original article', 'SFOffice.jpg': 'Office building from the original San Francisco article',
 'aet-values.jpg': 'Promotional claims banner from the original article', 'airplane.jpg': 'Airplane in flight',
 'ata.jpg': 'Historical ATA corporate membership certificate', 'boston15.png': 'People talking at a meeting',
 'chinese-language.jpg': 'Chinese writing on display', 'graduation.jpg': 'Graduates at a ceremony',
 'h1b-eol-customers.jpg': 'Illustration of people holding documents', 'hola.jpg': 'Illuminated Hola sign',
 'invite.jpg': 'Promotional invitation from the original article', 'lookingforjobs.jpg': 'Person on a busy city street',
 'nyc10.jpg': 'People at an event in the original article', 'nyc11.jpg': 'Meeting around a conference table',
 'nyc12.jpg': 'Office reception area', 'nyc13.jpg': 'Historical Google review screenshot',
 'nyc16.jpg': 'Historical Google review screenshot', 'nyc17.jpg': 'Historical credential evaluation report sample',
 'nyc18.jpg': 'People at a meeting', 'nyc2.jpg': 'Building exterior from the original New York article',
 'nyc3.jpg': 'Historical credential evaluation report sample', 'nyc4.jpg': 'Office interior from the original article',
 'nyc5.jpg': 'Building entrance from the original article', 'nyc6.jpg': 'People talking at a meeting',
 'nyc7.jpg': 'Meeting around a conference table', 'nyc8.jpg': 'Historical 2016 Yelp recognition',
 'nyc9.jpg': 'Office waiting area', 'passport.jpg': 'Passport on a table',
 'testimonials.png': 'Historical customer review screenshot', 'translationonline.jpg': 'Person typing on a laptop',
}
IMAGE_TEXT.update({'ACEI.png': 'Historical ACEI website screenshot', 'AET-IL.jpg': 'Historical Illinois credential evaluation promotional illustration', 'AET.png': 'Historical AET website screenshot', 'AETLA.png': 'Historical AET Los Angeles office page screenshot', 'CALIFCE.png': 'Historical California University FCE sign', 'CXC.png': 'Caribbean Examinations Council 50th anniversary website image', 'FCE Education.jpg': 'Laptop, notebook and backpack on a desk', 'FCE-Clients.jpg': 'Historical institution logo montage from the original article', 'FCE，Inc..png': 'Historical Foreign Credential Evaluations, Inc. website screenshot', 'GA-Immigrants.png': 'Illustration of people holding an American flag in a city', 'Google Review.png': 'Historical AET Google business listing and reviews', 'IE.png': 'Historical International Education Evaluators website screenshot', 'LA-Immigrants.png': 'Illustration of people near the Hollywood sign', 'SF-Immigrants.png': 'Illustration of people holding an American flag in San Francisco', 'SF.png': 'Historical AET San Francisco office page screenshot', 'ca-BarberCosmo.jpg': 'Historical California BarberCosmo evaluation promotional illustration', 'chinesestudents.jpg': 'Students in a crowd', 'chineseworkers.jpg': 'Two people working together at a computer', 'csec-grading.png': 'CSEC overall grade descriptors from the original article', 'eol-customers.jpg': 'Illustration of people holding expert opinion letters', 'h1b-data.png': 'Historical USCIS H-1B petition statistics table', 'h1b-education-evaluation-for-india.png': 'Illustration of Indian credential evaluation and H-1B documents', 'latin-america-map.jpg': 'Globe showing South America', 'latin-students.jpg': 'Students in a classroom', 'map-of-carribean.png': 'Map of the Caribbean', 'pakistan.jpg': 'Cityscape in Pakistan'})
IMAGE_TEXT.update({'question.jpg': 'Illustration of an international credential evaluation office', 'AAE.png': 'Historical Alianza Academic Evaluations website screenshot', 'ESI.png': 'Historical Evaluation Service, Inc. website screenshot', 'FCEI.png': 'Historical Foreign Credential Evaluations website screenshot', 'FCSA.png': 'Historical Foreign Credentials Service of America website screenshot', 'ICE.png': 'Historical InCred website screenshot', 'scholaro.png': 'Historical Scholaro website screenshot', 'SDR.png': 'Historical SDR Educational Consultants website screenshot', 'UCREDO.png': 'Historical Ucredo website screenshot', 'FCE-H1B.jpg': 'Historical H-1B credential evaluation promotional illustration'})
for name in ['SF1.jpg', 'SF3.jpg', 'SF4.jpg', 'SF6.jpg', 'SF7.jpg', 'SF8.jpg']:
 IMAGE_TEXT[name] = 'Office interior from the original San Francisco article'
HISTORICAL = {k for k, v in IMAGE_TEXT.items() if v.startswith('Historical') or k in {'aet-values.jpg','invite.jpg'}}


def normalized(text):
 return re.sub(r'\s+', '', text)


def digest(data):
 return hashlib.sha256(data).hexdigest()


def write(path, data):
 payload = data if isinstance(data, bytes) else data.encode()
 if CHECK:
  assert path.exists() and path.read_bytes() == payload, f'Generated file differs: {path}'
 else:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_bytes(payload)


def safe_link(value, slug):
 value = value.strip()
 if value.startswith('link to https://'): value = value.removeprefix('link to ')
 if not value: return None
 if value.startswith('#'): return value
 # Legacy includes also appear at root HTML URLs; root-relative resources
 # often omitted their leading slash. Resolve known local root files explicitly.
 relative = urlsplit(value)
 root_path = '/' + relative.path.lstrip('/')
 root_source = LEGACY / relative.path
 if not relative.scheme and not relative.netloc and not value.startswith('/') and (root_path in SERVICE_PATHS or root_source.is_file()):
  value = '/' + value
 full = urlsplit(urljoin(ORIGIN + '/blog/', value))
 if full.scheme in ('mailto', 'tel'): return value
 if full.scheme not in ('https', 'http'): raise ValueError(f'Unsafe link {value}')
 if full.hostname in ('americantranslationservice.com', 'www.americantranslationservice.com'):
  path = unquote(full.path)
  stem = Path(path).stem
  if stem in SLUGS: target = '/blog/' + stem
  elif path in SERVICE_PATHS: target = SERVICE_PATHS[path]
  elif path.startswith('/blog/'):
   REPORT['unlinkedExcludedArticles'].append({'article': slug, 'href': value})
   return None
  else: return ORIGIN + full.path + (('?' + full.query) if full.query else '') + (('#' + full.fragment) if full.fragment else '')
  return target + (('?' + full.query) if full.query else '') + (('#' + full.fragment) if full.fragment and '#' not in target else '')
 return value if value.startswith(('https://', 'http://')) else full.geturl()


def import_article(row):
 slug = row['slug']
 if row.get('sourceType') == 'standalone':
  entry = source = LEGACY / (slug + '.html')
  source_files = [source]
 else:
  entry = LEGACY / 'blog' / f'{slug}.php'
  includes = [s for s in re.findall(r"include\s*['\"]([^'\"]+)['\"]", entry.read_text()) if not s.startswith('../')]
  assert len(includes) == 1, slug
  source = entry.parent / includes[0]
  source_files = [entry, source]
  root_copy = LEGACY / f'{slug}.html'
  if root_copy.exists(): source_files.append(root_copy)
 for p in source_files:
  matches = list(BLOCKED.finditer(html.unescape(p.read_text())))
  if not matches: continue
  reviewed = BIOGRAPHY_REVIEW['sources'].get(str(p.relative_to(LEGACY)))
  biography_terms = {'naces', 'naces.org', 'national association of credential evaluation services'}
  assert (slug in BIOGRAPHY_REVIEW['slugs'] and reviewed == digest(p.read_bytes())
          and all(m.group().lower() in biography_terms for m in matches)), f'Unreviewed source match: {p.name}: {[m.group() for m in matches]}'
 if slug == PILOT: return
 raw = source.read_text()
 soup = BeautifulSoup(raw, 'lxml')
 main = soup.select_one('.main-content-with-sidebar') or max(soup.select('.contents'), key=lambda n:len(n.get_text()))
 removed = []
 for node in main.select('.fixed-sidebar, .ai-share-buttons, footer, script, style, link, iframe, form'):
  if node.parent is not None:
   removed.append(node.get('class', node.name));node.decompose()
 for table in main.find_all('table'):
  if 'Table of Contents:' in table.get_text():
   removed.append('duplicate table of contents');table.decompose()
 for node in main.find_all(string=lambda t: isinstance(t, Comment)): node.extract()
 # Drop decorative separator text, not prose.
 for p in main.find_all('p'):
  if '-' in p.get_text() and re.fullmatch(r'[-\s]+', p.get_text()) and not p.find('img'): p.decompose()
 for text in list(main.find_all(string=True)):
  if re.fullmatch(r'\s*-{3,}\s*', str(text)): text.extract()
 title_node = main.find(['h1', 'h2'])
 title = title_node.get_text(' ', strip=True)
 title_node.decompose()
 # Only the leading article date/byline is publication metadata. Dates in prose,
 # titles, copyright notices and filesystem timestamps are not substitutes.
 date_match = re.match(r'^(?:Written by [^|]+\|\s*)?(\d{2}\s*/\s*\d{2}\s*/\s*\d{4})(?=\s|$)', main.get_text(' ', strip=True))
 DATES[slug] = datetime.strptime(re.sub(r'\s+', '', date_match[1]), '%m/%d/%Y').date().isoformat() if date_match else None
 if title != row['title']: REPORT['titleDifferences'].append({'slug':slug,'catalog':row['title'],'body':title})
 # A missing legacy illustration has no replacement; retain its surrounding prose.
 for img in list(main.find_all('img')):
  if img.get('src') == '/images/A2Z.png' and slug in {'california-best-education-credential-evaluation-services', 'san-francisco-best-education-credential-evaluation-agencies'}:
   assert not (LEGACY / 'images/A2Z.png').exists(), 'A2Z image recovered; review and import it'
   REPORT['missingAssets'].append({'article': slug, 'source': img['src'], 'alt': img.get('alt'), 'reason': 'Absent from local source; old-site URL returned homepage HTML on 2026-09-30. Illustration omitted; organization prose and link retained.'})
   img.decompose()
 expected_text = normalized(main.get_text())
 expected_images = len(main.find_all('img'))
 expected_tables = len(main.find_all('table'))
 metadata = re.search(r'\$page_description\s*=\s*([\'"])(.*?)\1;', entry.read_text(), re.S)
 description = html.unescape(metadata.group(2)) if metadata else ''
 if row.get('sourceType') == 'standalone':
  meta = soup.find('meta', attrs={'name':'description'})
  description = meta.get('content', '') if meta else ''
 description = re.sub(r'\s+', ' ', description).strip()
 # Paragraph breaks replace obsolete layout <br>s. Short title-like lines become
 # headings only in older articles without semantic section headings.
 legacy_headings = not main.find(['h2','h3'])
 for p in list(main.find_all('p')):
  chunks = re.split(r'(?:<br\s*/?>\s*){2,}', p.decode_contents(), flags=re.I)
  if legacy_headings:
   chunks = [part for chunk in chunks for part in re.split(r'<br\s*/?>', chunk, flags=re.I)]
  if len(chunks) < 2: continue
  for chunk in chunks:
   frag = BeautifulSoup(chunk, 'html.parser')
   text = frag.get_text(' ',strip=True)
   if not text and not frag.find('img'): continue
   is_heading = legacy_headings and 8 < len(text) < 120 and not text.endswith(('.', ',', ':', '!')) and 'http' not in text
   new = soup.new_tag('h2' if is_heading else 'p')
   for child in list(frag.contents): new.append(child.extract())
   p.insert_before(new)
  p.decompose()
 # Source row IDs (q1, etc.) are retained for incoming fragments.
 used_ids = set(); toc = []
 for node in main.find_all(id=True):
  value = node['id']
  assert re.fullmatch(r'[A-Za-z0-9][\w:-]*', value), (slug,value)
  if value in used_ids:
   suffix = 2
   while f'{value}-{suffix}' in used_ids: suffix += 1
   node['id'] = f'{value}-{suffix}'
   REPORT['repairedIds'].append({'article':slug, 'original':value, 'target':node['id']})
   value = node['id']
  used_ids.add(value)
 for i, heading in enumerate(main.find_all(['h2','h3']), 1):
  parent = heading.parent
  target = heading.get('id') or (parent.get('id') if parent.name == 'div' and parent.find(['h2','h3']) is heading else None)
  if not target:
   target = f'section-{i}'
   while target in used_ids: target += '-heading'
   heading['id'] = target;used_ids.add(target)
  if heading.name == 'h2' or not main.find('h2'):
   toc.append({'id':target,'title':re.sub(r'^\d+\.\s*', '', heading.get_text(' ',strip=True))})
 images=[]
 for img in main.find_all('img'):
  original = '/' + unquote(img['src']).lstrip('./'); path = LEGACY / original.lstrip('/')
  assert path.is_relative_to(LEGACY / 'images') and path.is_file(), original
  assert path.name in IMAGE_TEXT, path.name
  data = path.read_bytes(); name = re.sub(r'[^a-z0-9.-]+','-',path.name.lower())
  target = ASSETS / name;write(target,data)
  with Image.open(path) as im: width,height=im.size
  images.append({'source':original,'path':'/images/blog/legacy/'+name,'width':width,'height':height})
  REPORT['assets'][original]={'path':'/images/blog/legacy/'+name,'sha256':digest(data),'width':width,'height':height}
  img.attrs={'src':'/images/blog/legacy/'+name,'alt':IMAGE_TEXT[path.name],'width':width,'height':height,'loading':'lazy','decoding':'async'}
 # Remove legacy style, behavior and layout attributes. Only reviewed static HTML
 # and tightly scoped attributes can reach dangerouslySetInnerHTML.
 allowed={'div','p','h2','h3','h4','ul','ol','li','b','strong','em','i','u','a','img','br','table','thead','tbody','tr','th','td','blockquote','hr','span','sup','sub'}
 for node in list(main.find_all()):
  if node.name == 'center': node.name='div'
  if node.name == 'h4': node.name='h3'
  if node.name not in allowed:
   node.unwrap();continue
  old=dict(node.attrs);node.attrs={}
  if 'id' in old: node['id']=old['id']
  if node.name=='a':
   href=safe_link(old.get('href',''),slug)
   if href: node['href']=href
   else: node.unwrap();continue
  if node.name=='img': node.attrs=old
  if node.name in ('td','th'):
   for k in ('rowspan','colspan'):
    if str(old.get(k,'')).isdigit(): node[k]=old[k]
   if node.name=='th':node['scope']='col'
 for empty in list(main.find_all(['p','div','i']))[::-1]:
  if not empty.get_text(strip=True) and not empty.find(['img','table']) and not empty.get('id'):empty.decompose()
 assert expected_text==normalized(main.get_text()), f'Prose changed: {slug}'
 # Images stay in source order; historical figures are discreet disclosures.
 for img, info in zip(main.find_all('img'), images):
  name=Path(info['source']).name
  figure=soup.new_tag('figure'); figure['class']='source-figure'
  image_link = img.find_parent('a')
  asset_node = image_link if image_link is not None else img
  asset_node.wrap(figure)
  if name in HISTORICAL:
   details=soup.new_tag('details');details['class']='source-archive';figure.wrap(details)
   summary=soup.new_tag('summary');summary.string=IMAGE_TEXT[name];details.insert(0,summary)
   caption=soup.new_tag('figcaption');caption.string='Historical image from the original article. Ratings, addresses and promotional details shown may be outdated.';figure.append(caption)
 for p in list(main.find_all('p')):
  if p.find(['figure', 'details']): p.unwrap()
 for table in main.find_all('table'):
  wrapper=soup.new_tag('div');wrapper['class']='table-scroll';wrapper['role']='region';wrapper['aria-label']='Article table';wrapper['tabindex']='0';table.wrap(wrapper)
 assert len(main.find_all('img')) == expected_images, f'Image lost: {slug}'
 assert len(main.find_all('table')) == expected_tables, f'Table lost: {slug}'
 ids={n['id'] for n in main.find_all(id=True)}
 for a in main.find_all('a',href=True):
  if a['href'].startswith('#'):
   target = a['href'][1:]
   if target not in ids and target.endswith('.html') and target[:-5] in ids:
    REPORT['repairedFragments'].append({'article': slug, 'original': a['href'], 'target': '#' + target[:-5]})
    a['href'] = '#' + target[:-5]
   assert a['href'][1:] in ids,(slug,a['href'])
 # H1 metadata comes from the body; dates remain exactly as displayed in source.
 body='\n'.join(str(n) for n in main.contents).strip()
 document={'slug':slug,'title':title,'description':description,'toc':toc,'html':body}
 write(OUT/f'{slug}.json',json.dumps(document,ensure_ascii=False,indent=2)+'\n')
 REPORT['articles'].append({'slug':slug,'topic':row['topic'],'source':str(source.relative_to(LEGACY)),
  'sourceSha256':digest(source.read_bytes()),'proseSha256':digest(expected_text.encode()),
  'proseCharacters':len(expected_text),'images':len(images),'tables':len(main.find_all('table')),
  'headings':len(toc),'removedChrome':removed})

for row in sorted(CATALOG,key=lambda r:r['topic']!='evaluation'): import_article(row)
assert len(REPORT['articles']) == len(CATALOG) - 1
redirects=[]
for row in CATALOG:
 paths=[] if row.get('sourceType') == 'standalone' else [f"/blog/{row['slug']}.php"]
 if (LEGACY/f"{row['slug']}.html").exists(): paths.append(f"/{row['slug']}.html")
 redirects.extend({'source':path,'destination':'/blog/'+row['slug'],'permanent':True} for path in paths)
write(ROOT/'content/blog/redirects.json',json.dumps(redirects,indent=2)+'\n')
imports=[];entries=[]
for i,row in enumerate(REPORT['articles']):
 imports.append(f"import post{i} from '@/content/blog/posts/{row['slug']}.json';")
 entries.append(f"  '{row['slug']}': post{i},")
write(ROOT/'lib/blog-posts.ts',"// Generated by scripts/migrate-blog.py. Article bodies stay on the server.\nimport 'server-only';\n"+'\n'.join(imports)+"\n\nexport type MigratedPost = { slug: string; title: string; description: string; toc: { id: string; title: string }[]; html: string };\nexport const blogPosts: Record<string, MigratedPost> = {\n"+'\n'.join(entries)+"\n};\n")
titles={row['slug']:json.loads((OUT/f"{row['slug']}.json").read_text())['title'] for row in REPORT['articles']}
titles[PILOT]=json.loads((ROOT/'content/blog'/f'{PILOT}.en.json').read_text())['title']
write(ROOT/'content/blog/titles.json',json.dumps(titles,ensure_ascii=False,indent=2)+'\n')
write(ROOT/'content/blog/dates.json',json.dumps(DATES,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
write(ROOT/'content/blog/migration-report.json',json.dumps(REPORT,ensure_ascii=False,indent=2)+'\n')
print(('Checked' if CHECK else 'Imported'),len(REPORT['articles']),'articles;',len(REPORT['assets']),'unique assets;',len(REPORT['unlinkedExcludedArticles']),'links to excluded articles unlinked; source prose unchanged.')
print('Topics:',dict(collections.Counter(r['topic'] for r in REPORT['articles'])))
