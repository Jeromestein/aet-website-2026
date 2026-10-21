import s from './crm.module.css';

type Run = {
  id: string; state: string; model?: string; created_at: string;
  input_version: number; prompt_version?: string; error?: string;
  input?: { documents?: { id: string; source?: { path?: string } }[] };
  usage?: { input_tokens?: number; output_tokens?: number };
  output?: { basis?: string; issues?: { code: string; description: string }[];
    evidence?: { documentId: string; page: number; fact: string }[] };
};
export default function AnalysisHistory({ runs }: { runs: Run[] }) {
  if (!runs.length) return null;
  return <section><h3>AI analysis history</h3>{runs.map(run => <details key={run.id}>
    <summary>{run.state} · {run.model || 'Legacy assessment'} · {new Date(run.created_at).toLocaleString('en-US')}</summary>
    <p className={s.helperText}>Input version {run.input_version} · {run.prompt_version || 'Legacy prompt'} · {run.output?.basis?.replaceAll('_', ' ') || 'Assessment'}</p>
    {run.error && <p className={s.formError}>{run.error}</p>}
    {run.usage && <p className={s.helperText}>Tokens: {run.usage.input_tokens ?? '—'} input / {run.usage.output_tokens ?? '—'} output</p>}
    {!!run.input?.documents?.length && <ul>{run.input.documents.map(document => <li key={document.id}>{document.id}: {document.source?.path?.split('/').pop() || 'Supporting file'}</li>)}</ul>}
    {(run.output?.issues || []).map((issue, i) => <p key={i}>{issue.code}: {issue.description}</p>)}
    {(run.output?.evidence || []).map((evidence, i) => <p key={i}>{evidence.documentId}, page {evidence.page}: {evidence.fact}</p>)}
  </details>)}</section>;
}
