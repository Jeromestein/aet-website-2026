/** Differences contain paths only, never customer data or provider references.
 * Compare already-authorized primary responses; never invoke a primary reader
 * here (the existing Status reader can publish results/enqueue email). */
export function differingPaths(expected: unknown, actual: unknown, path = '$'): string[] {
  if (expected instanceof Date) expected = expected.toISOString();
  if (actual instanceof Date) actual = actual.toISOString();
  if (Object.is(expected,actual)) return [];
  if (expected === null || actual === null || typeof expected !== 'object' || typeof actual !== 'object') return [path];
  const a = expected as Record<string,unknown>, b = actual as Record<string,unknown>;
  return [...new Set([...Object.keys(a),...Object.keys(b)])].sort()
    .flatMap(key => differingPaths(a[key],b[key],`${path}.${key}`));
}

export function statusComparison(primary: Record<string,unknown>, shadow: Record<string,unknown>) {
  const fields = ['id','first_name','middle_name','last_name','email','country','status','payment_status',
    'ai_status','uploads_pending','document_issue','result','result_version','education','created_at','updated_at'];
  const project = (row: Record<string,unknown>) => Object.fromEntries(fields.map(key => [key,row[key]]));
  const files = (value: unknown) => (value as Record<string,unknown>[]).map(file => ({ id:file.id,name:file.name,
    mime_type:file.mime_type,bytes:file.bytes,state:file.state })).sort((a,b) => String(a.id).localeCompare(String(b.id)));
  return differingPaths({ ...project(primary), files:files(primary.files) },{ ...project(shadow), files:files(shadow.files) });
}
