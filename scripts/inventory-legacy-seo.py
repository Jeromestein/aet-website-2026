"""Reconcile legacy sitemap, root pages, blog entries and Apache aliases.

Read-only against the old checkout. Pass a JSON array from next.config redirects().
Unreviewed content is recorded as a launch gate, never silently published or retired.
"""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--redirects', type=Path, required=True)
parser.add_argument('--legacy', type=Path, default=Path('../server-54.213.58.23/americantranslationservice.com'))
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
legacy = args.legacy
redirects = {r['source']: r['destination'] for r in json.loads(args.redirects.read_text())}
urls = {}
def add(path, source): urls.setdefault(path, set()).add(source)
for node in ET.parse(legacy/'sitemap.xml').findall('{*}url/{*}loc'): add(urlsplit(node.text).path, 'sitemap')
for pattern in ['*.html','*.php','blog/*.php']:
    for p in legacy.glob(pattern): add('/'+str(p.relative_to(legacy)), 'source file')
for source, destination in re.findall(r'^Redirect\s+301\s+(\S+)\s+(\S+)', (legacy/'.htaccess').read_text(), re.M):
    add(source,'Apache alias'); add(urlsplit(destination).path,'Apache target')
for path in redirects: add(path, 'app redirect')
removed = re.compile(r'(visa|authentication|threecertification|(?:^|[-_])writing|c_paper|schengen)',re.I)
rows = []
for path, sources in sorted(urls.items()):
    destination = redirects.get(path)
    file = legacy/path.lstrip('/')
    if destination: status, reason = 'redirect', 'Retained equivalent page or section'
    elif (root/'public'/path.lstrip('/')).is_file(): status,reason='retained asset','Served at the original URL'
    elif path == '/blog': status,reason='retained page','Canonical blog index'
    elif path == '/blog/': status,reason,destination='normalize','Framework trailing-slash normalization','/blog'
    elif '-content' in path or path in ['/body.html','/header.html','/header-zh.html','/header-es.html','/footer.html','/footer-zh.html','/footer-es.html','/e_evaluation-content.html','/e_notarized-content.html']:
        status,reason='internal source','PHP include/partial; not a standalone migration target'
    elif path in ['/apply.php','/yz.php']:
        status,reason='retired endpoint','Legacy application backend; the new site links to the existing application portal'
    elif removed.search(path): status,reason='removed scope','Visa, editing or consular-authentication content excluded from rebuilt site; no unrelated redirect'
    elif path.startswith('/google'):
        status,reason='owner verification','Legacy Search Console verification file; retain only if owner confirms the property still uses this token'
    elif path.endswith('.pdf'):
        status,reason='review asset','Unmigrated legacy PDF; contents/version and continued public availability need owner review'
    elif path in ['/old-index.html','/backup-best-education-credential-evaluation-agencies.html']:
        status,reason='archive','Historical backup; excluded from index and migration'
    else:
        status,reason='review content','Not in the approved retained catalog; source/content disposition required before cutover'
    rows.append(dict(path=path,sources=sorted(sources),status=status,destination=destination,reason=reason,sourceExists=file.is_file()))
out=root/'content/seo';out.mkdir(exist_ok=True)
(out/'legacy-url-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
counts=Counter(r['status'] for r in rows)
lines=['# Legacy SEO URL Reconciliation','',
'Local source audit, September 30, 2026. Includes all 208 sitemap entries (deduplicated by path), root HTML/PHP files, blog PHP entries, Apache aliases/targets and new application redirects. Static image directories are not crawl-page inventory. No old PHP is executed.','',
'## Disposition and launch gates','',
'- `redirect`, `normalize`, and `retained asset` have implemented destinations.',
'- `removed scope`, `archive`, `internal source`, and `retired endpoint` are intentionally absent from the new public page catalog. They return a genuine 404 unless mapped above. Do not redirect them to the homepage.',
'- `review content` and `review asset` remain unapproved for publication or permanent retirement. Keep the old deployment until the owner resolves these rows or provides a legacy-serving arrangement. A default 404 is not approval to lose this content.',
'- The existing blog review lists 30 held article families plus one visa family. Chinese source-only variants and other standalone findings also remain explicit below.',
'- `owner verification` requires the owner to confirm Search Console verification. No token is copied or account access changed by this audit.',
'- Root PDF samples differ from the already retained `/down/` versions. They are not treated as byte-identical aliases.',
'', '| Status | URLs |','| --- | ---: |']
lines += [f'| {key} | {value} |' for key,value in sorted(counts.items())]
lines += ['', '## Complete inventory','', '| Old path | Status | Destination | Evidence / reason |','| --- | --- | --- | --- |']
lines += [f"| `{r['path']}` | {r['status']} | {('`'+r['destination']+'`') if r['destination'] else '—'} | {', '.join(r['sources'])}. {r['reason']} |" for r in rows]
(root/'docs/seo-legacy-urls.md').write_text('\n'.join(lines)+'\n')
print(len(rows), dict(counts))
