export type WorkspaceView = 'applications' | 'formal' | 'equivalency' | 'payments' | 'documents';
export type WorkspaceFilter = 'all' | 'attention' | 'processing' | 'completed';
export type CaseKind = 'formal' | 'preeval';
export type CaseReference = { id: string; kind: CaseKind };
export type Education = { degree: string; school: string; country: string; start: string; end: string };
export type WorkspaceFile = { id: string; kind: string; name: string; bytes: number };
export type WorkspacePayment = { id: string; session_id: string | null; amount_cents: number; status: string; created_at: string };
export type WorkspaceRow = CaseReference & {
  name: string; email: string; office: string | null; service: string; purpose: string;
  country: string; educations: Education[]; status: string; payment_status: string;
  amount: number | null; created_at: string; updated_at: string;
  files: WorkspaceFile[]; payments: WorkspacePayment[]; attention: boolean;
};
export type WorkspaceCounts = { total: number; attention: number; processing: number; completed: number };
export type WorkspaceSnapshot = {
  rows: WorkspaceRow[]; total: number; page: number; pageSize: number;
  counts: WorkspaceCounts; stats: WorkspaceCounts & { unpaid: number; outstanding: number; unquoted: number; documents: number };
  staff: { email: string; offices: string[]; includeUnassigned: boolean };
  cloudPreview: boolean;
};
export const officeCodes: Record<string, string> = { Boston: 'BOS', 'New York': 'NYC', Miami: 'MIA', 'Los Angeles': 'LA', 'San Francisco': 'SF' };
export const label = (value: string) => ({ submitted: 'Submitted', reviewing: 'In review', processing: 'In progress', needs_information: 'Needs information', completed: 'Completed', cancelled: 'Cancelled', unpaid: 'Unpaid', pending: 'Pending', paid: 'Paid', refunded: 'Refunded', partially_refunded: 'Partially refunded', pdf: 'PDF', paper: 'Paper copy', extraCopy: 'Extra copy', standard: 'Standard' }[value] || value.replaceAll('_', ' ').replace(/^./, character => character.toUpperCase()));
export const money = (cents: number | null) => cents === null ? 'Quote needed' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const date = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
export function caseApi(row: CaseReference) { return `/api/${row.kind === 'formal' ? 'evaluation' : 'pre-evaluation'}/applications/${row.id}`; }
export function fileUrl(row: CaseReference, file: WorkspaceFile) { return row.kind === 'formal' ? `${caseApi(row)}/files/${file.id}` : `/api/pre-evaluation/files/${file.id}`; }
export function workspaceCsv(rows: WorkspaceRow[]) {
  const cells = [['Application ID','Workflow','Client','Email','Education','Service','Office','Status','Payment','Amount USD','Updated'], ...rows.map(r => [r.id,r.kind,r.name,r.email,r.educations.map(e => `${e.degree} / ${e.school}`).join('; '),r.service,r.office || 'Unassigned',label(r.status),label(r.payment_status),r.amount === null ? '' : (r.amount / 100).toFixed(2),date(r.updated_at)])];
  return '\uFEFF' + cells.map(row => row.map(value => '"' + (/^[\s]*[=+\-@]|^[\t\r\n]/.test(value) ? "'" + value : value).replaceAll('"','""') + '"').join(',')).join('\r\n');
}

export const purposeLabel = (value: string) => label(value.replace(/^evaluation-/, ''));
