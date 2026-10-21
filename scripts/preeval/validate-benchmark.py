"""Offline validation of a private, document-only pre-evaluation corpus.

Requires pypdf. Does not load API keys or contact external services.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET

from pypdf import PdfReader


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(root):
    root = Path(root).resolve()

    def path(relative):
        candidate = (root / relative).resolve()
        require(candidate.is_relative_to(root), 'Path escapes dataset root')
        return candidate

    def record(item):
        target = path(item['path'])
        content = target.read_bytes()
        require(len(content) == item['bytes'], 'File size mismatch')
        require(hashlib.sha256(content).hexdigest() == item['sha256'], 'File hash mismatch')
        return target

    manifest = json.loads(path('manifest.json').read_text())
    requests = json.loads(path('model-inputs.json').read_text())
    require(manifest['version'] == requests['version'] == 1, 'Unsupported version')
    require(set(requests) == {'version', 'cases'}, 'Unexpected request metadata')
    ids = [case['id'] for case in manifest['cases']]
    require(len(ids) == len(set(ids)) and len(ids) > 0, 'Duplicate or empty cases')
    require([case['id'] for case in requests['cases']] == ids, 'Request case mismatch')
    reference_hashes = {r['sha256'] for c in manifest['cases'] for r in c['references']}
    total_pages = 0
    for case, request in zip(manifest['cases'], requests['cases']):
        cid = case['id']
        require(set(request) == {'id', 'academic', 'documents'}, 'Unexpected request fields')
        require(request['academic'] == dict.fromkeys(['school', 'country', 'degree', 'start', 'end'], ''),
                'Document-only dataset must not infer form fields from reports')
        original = PdfReader(record(case['original']))
        require(len(original.pages) == case['original']['pages'], 'Original page count mismatch')
        for reference in case['references']:
            require(reference['path'].startswith(f'cases/{cid}/references/'), 'Invalid reference path')
            record(reference)
        expected = json.loads(record(case['expected']).read_text())
        require(expected['case_id'] == cid, 'Expected case mismatch')
        require(set(expected['scored_dimensions']) == {'level', 'field'} |
                ({'concentration'} if expected['concentration'] else set()), 'Invalid scoring scope')
        require(expected['level'] and expected['us_equivalency'] and expected['field'], 'Missing answer')
        provenance = expected['provenance']
        require(provenance['path'] in [r['path'] for r in case['references']], 'Unregistered reference')
        with zipfile.ZipFile(path(provenance['path'])) as archive:
            tree = ET.fromstring(archive.read('word/document.xml'))
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns))
                      for p in tree.findall('.//w:p', ns)]
        require(paragraphs[provenance['paragraph_1_based'] - 1] == provenance['excerpt'],
                'Reference excerpt mismatch')
        require(expected['us_equivalency'] in provenance['excerpt'], 'Unsourced equivalency')
        documents = case['inputs']
        require(1 <= len(documents) <= 5, 'Document count exceeds current limits')
        require(sum(d['bytes'] for d in documents) <= 30 * 1024 * 1024, 'Inputs exceed byte limit')
        require(len({d['id'] for d in documents}) == len(documents), 'Duplicate document IDs')
        require(sum(d['pages'] for d in documents) <= 20, 'Inputs exceed total page limit')
        coverage = []
        for document in documents:
            require(document['path'].startswith(f'cases/{cid}/inputs/'), 'Report cannot be an input')
            require(document['sha256'] not in reference_hashes, 'Reference duplicated as input')
            prepared = PdfReader(record(document))
            require(document['mime'] == 'application/pdf', 'Unexpected MIME type')
            require(1 <= len(prepared.pages) == document['pages'] <= 10, 'Prepared page count invalid')
            require(len(document['source_pages']) == len(prepared.pages), 'Missing page mapping')
            coverage.extend(document['source_pages'])
        require(coverage == list(range(1, len(original.pages) + 1)), 'Dropped, repeated or reordered pages')
        allowed = [{k: v for k, v in document.items() if k != 'source_pages'} for document in documents]
        require(request['documents'] == allowed, 'Request must contain only registered input files')
        total_pages += len(original.pages)
    return {'cases': len(ids), 'source_pages': total_pages, 'model_called': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dataset', nargs='?', default='.local/preeval-benchmark/fce-v1')
    args = parser.parse_args()
    print(json.dumps(validate(args.dataset)))
