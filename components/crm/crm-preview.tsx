'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Calculator, Check,
  CheckCheck, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, Clock3,
  CreditCard, FileCheck2, FileText, FolderOpen, GraduationCap, LayoutDashboard,
  Link2, Mail, MapPin, Menu, Plus, RotateCcw, Search, Upload, X,
} from 'lucide-react';
import {
  demoApplications, demoPayments, money, needsAttention, officeCodes, offices, services, stageLabels,
  type Application, type Office, type PaymentRequest, type Service, type Stage,
} from './demo-data';
import s from './crm.module.css';

type View = 'applications' | 'payments' | 'equivalency' | 'documents';
type Filter = 'all' | 'attention' | 'processing' | 'completed';
type Modal = 'new' | 'payment' | 'import' | 'calculator' | null;
const viewNames: Record<View, string> = { applications: 'Applications', payments: 'Payment links', equivalency: 'Pre-evaluations', documents: 'Documents' };
const viewDescriptions: Record<View, string> = {
  applications: 'Manage applications from submission to delivery.',
  payments: 'Keep payment requests and their linked applications in one place.',
  equivalency: 'Review preliminary assessments before the next step in a client’s journey.',
  documents: 'See what has arrived, what needs review, and what is still missing.',
};
function OfficeBadge({ office, large = false }: { office: Office; large?: boolean }) {
  return <span className={s.officeBadge + (large ? ' ' + s.largeOfficeBadge : '')} data-office={officeCodes[office]} role="img" aria-label={office + ' office'} title={office + ' office'}>{officeCodes[office]}</span>;
}

const educationSummary = (row: Application) => row.educations[0]?.degree || 'Not provided';
const educationHint = (row: Application) => row.educations.length ? row.educations[0].country + (row.educations.length > 1 ? ' · ' + row.educations.length + ' records' : '') : 'No education records';

function DetailTrigger({ row, section, onOpen }: { row: Application; section: 'education' | 'service'; onOpen: () => void }) {
  const title = section === 'education' ? educationSummary(row) : row.service;
  const hint = section === 'education' ? educationHint(row) : row.purpose;
  if (section === 'education' && !row.educations.length) {
    return <div className={s.detailCellEmpty}><span className={s.cellTitle}>{title}</span><small className={s.cellHint}>{hint}</small></div>;
  }
  return <button type="button" className={s.detailCell} aria-label={'View ' + section + ' for ' + row.name} aria-haspopup="dialog" title={'View ' + section + ' details'} onClick={onOpen}>
    <span className={s.cellTitle}><span>{title}</span><ChevronRight size={16} strokeWidth={2} aria-hidden="true" /></span>
    <small className={s.cellHint}>{hint}</small>
  </button>;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={s.badge + ' ' + (s[tone] || '')}>{children}</span>;
}

function PreviewDialog({ open, onClose, title, children, drawer = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  return <dialog ref={ref} aria-label={title} className={s.dialog + (drawer ? ' ' + s.drawer : '')}
    onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={s.dialogInner}>
      <div className={s.dialogHeader}><span>{drawer ? 'APPLICATION DETAILS' : 'WORKSPACE PREVIEW'}</span>
        <button type="button" className={s.iconButton} aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>
      {children}
    </div>
  </dialog>;
}

export default function CRMPreview() {
  const [applications, setApplications] = useState<Application[]>(demoApplications);
  const [payments, setPayments] = useState<PaymentRequest[]>(demoPayments);
  const [view, setView] = useState<View>('applications');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [office, setOffice] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [modal, setModal] = useState<Modal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState('');
  const [formError, setFormError] = useState('');
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [csv, setCsv] = useState('');
  const [gpa, setGpa] = useState([{ grade: '4', credits: '3' }, { grade: '3', credits: '3' }, { grade: '3.7', credits: '3' }]);
  const selected = applications.find(row => row.id === selectedId);
  const scoped = applications.filter(row => office === 'all' || row.office === office);
  const attention = scoped.filter(needsAttention);
  const outstanding = scoped.filter(row => row.payment === 'pending' && row.stage !== 'cancelled');
  const processing = scoped.filter(row => row.stage === 'processing');
  const complete = scoped.filter(row => row.stage === 'completed');
  const documentCount = scoped.flatMap(row => row.documents).filter(doc => doc.status === 'Received').length;
  const candidates = scoped.filter(row => view !== 'equivalency' || row.service === 'Pre-Evaluation');
  const filtered = candidates.filter(row => {
    const matchesText = [row.name, row.email, row.id, row.service, row.office, officeCodes[row.office], ...row.educations.flatMap(education => [education.degree, education.school, education.country])].join(' ').toLowerCase().includes(search.toLowerCase().trim());
    const matchesFilter = filter === 'all' || (filter === 'attention' ? needsAttention(row) : row.stage === filter);
    return matchesText && matchesFilter;
  }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'oldest' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id));
  const perPage = 7;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visiblePage = Math.min(page, pageCount);
  const rows = filtered.slice((visiblePage - 1) * perPage, visiblePage * perPage);
  const visiblePayments = payments.filter(payment => {
    const row = applications.find(item => item.id === payment.applicationId);
    return row && (office === 'all' || row.office === office) && [row.name, payment.id, row.id, payment.method].join(' ').toLowerCase().includes(search.trim().toLowerCase());
  });
  const totalCredits = gpa.reduce((sum, row) => sum + (Number(row.credits) || 0), 0);
  const gradeAverage = totalCredits ? (gpa.reduce((sum, row) => sum + Number(row.grade) * (Number(row.credits) || 0), 0) / totalCredits).toFixed(2) : '—';

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const sidebar = sidebarRef.current;
    const buttons = () => Array.from(sidebar?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') || []);
    buttons()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); }
      if (event.key === 'Tab') {
        const elements = buttons();
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      menuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  const openApplication = (id: string, tab = 'overview') => { setSelectedId(id); setDetailTab(tab); setFormError(''); };
  const openModal = (value: Modal) => { setModal(value); setFormError(''); setMenuOpen(false); };
  const changeView = (value: View) => { setView(value); setFilter('all'); setSearch(''); setPage(1); setMenuOpen(false); };
  const addEvent = (id: string, message: string) => setEvents(current => ({ ...current, [id]: [message, ...(current[id] || [])] }));
  const updateApplication = (patch: Partial<Application>, message: string) => {
    if (!selected) return;
    setApplications(current => current.map(row => row.id === selected.id ? { ...row, ...patch } : row));
    addEvent(selected.id, message);
    setToast(message + ' · preview only');
  };
  const reset = () => {
    setApplications(demoApplications); setPayments(demoPayments); setEvents({});
    setSearch(''); setOffice('all'); setFilter('all'); setPage(1); setSort('newest');
    setMenuOpen(false); setToast('Sample workspace reset.');
  };

  function createApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) { setFormError('Enter a client name.'); return; }
    const id = 'AET-' + (Math.max(...applications.map(row => Number(row.id.slice(4)))) + 1);
    const row: Application = {
      id, name, email: String(form.get('email')), service: form.get('service') as Service, office: form.get('office') as Office,
      amount: Number(form.get('amount')), purpose: String(form.get('purpose')), country: 'Not specified', educations: [],
      stage: 'submitted', payment: 'pending', updated: '2026-10-01', due: 'Not set',
      documents: [{ name: 'Supporting documents', status: 'Missing' }], notes: 'Created in this preview. No client was contacted.',
    };
    setApplications(current => [row, ...current]);
    setModal(null); setOffice('all'); changeView('applications');
    setToast('Sample application ' + id + ' created.');
  }

  function createPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) { setFormError('Enter a positive amount.'); return; }
    const payment: PaymentRequest = {
      id: 'PAY-' + String(Math.max(...payments.map(row => Number(row.id.slice(4)))) + 1).padStart(4, '0'),
      applicationId: String(form.get('application')), amount, status: 'Draft', method: 'Stripe',
    };
    setPayments(current => [payment, ...current]);
    setModal(null); setOffice('all'); changeView('payments');
    setToast('Payment request saved as a sample draft. No live link was created.');
  }

  function importOrders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2 || lines.length > 51 || lines[0].trim().toLowerCase() !== 'name,email,service,office,amount') {
      setFormError('Use the five-column sample format with 1–50 orders.'); return;
    }
    const imported: Application[] = [];
    const nextId = Math.max(...applications.map(row => Number(row.id.slice(4)))) + 1;
    for (const [index, line] of lines.slice(1).entries()) {
      const fields = line.split(',').map(field => field.trim());
      const [name, email, service, rowOffice, amount] = fields;
      if (fields.length !== 5 || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !services.includes(service as Service) || !offices.includes(rowOffice as Office) || !amount || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
        setFormError('Check row ' + (index + 2) + ': use a listed service and office, a valid email, and a nonnegative amount. Commas inside fields are not supported in this preview.');
        return;
      }
      imported.push({
        id: 'AET-' + (nextId + index), name, email, service: service as Service, office: rowOffice as Office,
        amount: Number(amount), stage: 'submitted', payment: 'pending', purpose: 'Not specified', country: 'Not specified', educations: [],
        updated: '2026-10-01', due: 'Not set', documents: [{ name: 'Supporting documents', status: 'Missing' }],
        notes: 'Imported into the local preview only.',
      });
    }
    setApplications(current => [...imported, ...current]); setModal(null); setOffice('all'); changeView('applications');
    setToast(imported.length + ' sample orders imported into this preview.');
  }

  function exportRows() {
    const contents = [
      ['Application ID', 'Client', 'Education', 'Service', 'Office', 'Status', 'Payment status', 'Quoted amount', 'Updated'],
      ...filtered.map(row => [row.id, row.name, row.educations.map(education => education.degree + ' / ' + education.country).join('; '), row.service, row.office, row.stage, row.payment, String(row.amount), row.updated]),
    ].map(row => row.map(cell => '"' + (/^[=+\-@\t\r]/.test(cell) ? "'" + cell : cell).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'aet-crm-preview.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Exported ' + filtered.length + ' sample applications.');
  }

  const navigation = [
    { id: 'applications' as View, label: 'Applications', icon: LayoutDashboard, count: applications.length },
    { id: 'payments' as View, label: 'Payment links', icon: CreditCard },
    { id: 'equivalency' as View, label: 'Pre-evaluations', icon: GraduationCap },
    { id: 'documents' as View, label: 'Documents', icon: FolderOpen },
  ];

  return <div className={s.workspace} lang="en">
    <a className={s.skipLink} href="#crm-main">Skip to workspace</a>
    {menuOpen && <button className={s.menuBackdrop} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside ref={sidebarRef} id="crm-navigation" className={s.sidebar + (menuOpen ? ' ' + s.sidebarOpen : '')}>
      <a className={s.brand} href="/" aria-label="AET website"><img src="/brand/aet-logo-header.svg" width="190" height="44" alt="American Education and Translation Services,CORP (AET)" /></a>
      <div className={s.workspaceLabel}><span className={s.workspaceMark}><LayoutDashboard size={17} /></span><div>AET Workspace<small>Client services</small></div><span className={s.liveDot} /></div>
      <p className={s.navLabel}>WORKSPACE</p>
      <nav aria-label="CRM navigation" className={s.nav}>
        {navigation.map(item => <button type="button" key={item.id} onClick={() => changeView(item.id)} className={view === item.id ? s.navActive : ''} aria-current={view === item.id ? 'page' : undefined}>
          <item.icon size={19} strokeWidth={1.7} /><span>{item.label}</span>{item.count !== undefined && <span className={s.navCount}>{item.count}</span>}
        </button>)}
      </nav>
      <p className={s.navLabel}>TOOLS</p>
      <nav className={s.nav} aria-label="CRM tools">
        <button onClick={() => openModal('import')}><Upload size={18} strokeWidth={1.7} />Import orders</button>
        <button onClick={() => openModal('calculator')}><Calculator size={18} strokeWidth={1.7} />GPA calculator</button>
      </nav>
      <div className={s.sidebarBottom}>
        <div className={s.previewCard}><span className={s.previewIcon}><LayoutDashboard size={18} /></span><strong>Preview workspace</strong><p>Explore with sample data.<br />Changes reset on refresh.</p><button onClick={reset}><RotateCcw size={13} />Reset preview</button></div>
        <a className={s.websiteLink} href="/">Visit AET website<ArrowUpRight size={15} /></a>
        <div className={s.profile}><span>AT</span><div>AET team<small>Preview workspace</small></div><Badge tone="blue">Demo</Badge></div>
      </div>
    </aside>

    <div className={s.mainShell} inert={menuOpen}>
      <header className={s.topbar}>
        <div className={s.breadcrumb}><button ref={menuButtonRef} className={s.mobileMenu + ' ' + s.iconButton} onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="crm-navigation" aria-label="Open navigation"><Menu size={21} /></button><span>Workspace</span><ChevronRight size={13} /><strong>{viewNames[view]}</strong></div>
        <div className={s.topbarRight}><span className={s.previewPill}><span />Sample data</span><span className={s.date}>Thursday, October 1, 2026</span><span className={s.topAvatar}>AT</span></div>
      </header>

      <main id="crm-main" className={s.main}>
        <div className={s.pageHeading}><div><div className={s.eyebrow}>AET CLIENT SERVICES</div><h1>{viewNames[view]}<span className={s.headingDot}>.</span></h1><p>{viewDescriptions[view]}</p></div>
          <div className={s.headingActions}>
            <button className={s.secondaryButton} onClick={() => openModal('import')}><Upload size={16} />Import orders</button>
            <button className={s.primaryButton} onClick={() => openModal(view === 'payments' ? 'payment' : 'new')}><Plus size={17} />{view === 'payments' ? 'New payment request' : 'New application'}</button>
          </div>
        </div>

        <section className={s.stats} aria-label="Application overview">
          <button className={s.stat} onClick={() => { changeView('applications'); setFilter('all'); }}><div className={s.statTop}>Total applications<LayoutDashboard size={17} /></div><div className={s.statValue}>{scoped.length}<span>Across {office === 'all' ? 'all offices' : office}</span></div><div className={s.statBottom}><span className={s.tinyDot} />Sample workspace overview</div></button>
          <button className={s.stat + ' ' + s.attentionStat} onClick={() => { changeView('applications'); setFilter('attention'); }}><div className={s.statTop}>Needs attention<Clock3 size={17} /></div><div className={s.statValue}>{attention.length}<span>Ready for your next step</span></div><div className={s.statBottom}>View applications<ArrowRight size={14} /></div></button>
          <button className={s.stat} onClick={() => { changeView('applications'); setFilter('processing'); }}><div className={s.statTop}>In progress<FileCheck2 size={17} /></div><div className={s.statValue}>{processing.length}<span>Moving toward completion</span></div><div className={s.statBottom}><span className={s.tinyDot + ' ' + s.greenDot} />{complete.length} completed applications</div></button>
          <button className={s.stat} onClick={() => changeView('payments')}><div className={s.statTop}>Awaiting payment<CreditCard size={17} /></div><div className={s.statValue}>{money(outstanding.reduce((sum, row) => sum + row.amount, 0))}<span>{outstanding.length} unpaid applications</span></div><div className={s.statBottom}>View payment requests<ArrowRight size={14} /></div></button>
        </section>

        <div className={s.focusStrip}><span className={s.focusIcon}><FileCheck2 size={19} /></span><div><strong>Documents ready for review</strong><span>{documentCount} documents awaiting your review.</span></div><button onClick={() => changeView('documents')}>Review documents<ArrowRight size={15} /></button></div>

        <section className={s.tablePanel} aria-label={viewNames[view] + ' list'}>
          <div className={s.panelHeader}>
            {view === 'applications' || view === 'equivalency' ? <div className={s.tabs} role="group" aria-label="Application status filter">
              {([
                ['all', 'All applications', candidates.length],
                ['attention', 'Needs attention', candidates.filter(needsAttention).length],
                ['processing', 'In progress', candidates.filter(row => row.stage === 'processing').length],
                ['completed', 'Completed', candidates.filter(row => row.stage === 'completed').length],
              ] as const).map(([value, label, count]) => <button key={value} aria-pressed={filter === value} className={filter === value ? s.tabActive : ''} onClick={() => { setFilter(value); setPage(1); }}>{label}<span>{count}</span></button>)}
            </div> : <h2>{view === 'payments' ? 'Payment requests' : 'Client documents'}<span>{view === 'payments' ? visiblePayments.length : scoped.flatMap(row => row.documents).length}</span></h2>}
            {(view === 'applications' || view === 'equivalency') && <button className={s.exportButton} onClick={exportRows}><ArrowDownToLine size={15} />Export</button>}
          </div>
          <div className={s.filters}>
            <label className={s.search}><Search size={18} /><span className={s.srOnly}>Search applications</span><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder={view === 'payments' ? 'Search client or payment reference…' : 'Search name, ID, or service…'} />{search && <button aria-label="Clear search" onClick={() => { setSearch(''); setPage(1); }}><X size={14} /></button>}</label>
            <div className={s.filterControls}><label className={s.selectWrap}><MapPin size={15} /><span className={s.srOnly}>Office</span><select value={office} onChange={event => { setOffice(event.target.value); setPage(1); }}><option value="all">All offices</option>{offices.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
              {(view === 'applications' || view === 'equivalency') && <label className={s.selectWrap}><span className={s.srOnly}>Sort applications</span><select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select><ChevronDown size={13} /></label>}
            </div>
          </div>

          {(view === 'applications' || view === 'equivalency') && <>
            <div className={s.tableWrap}><table className={s.table}><thead><tr><th>CLIENT / APPLICATION</th><th>EDUCATION</th><th>SERVICE</th><th>STATUS</th><th>PAYMENT</th><th>UPDATED</th><th><span className={s.srOnly}>Open application</span></th></tr></thead><tbody>
              {rows.map(row => <tr key={row.id}>
                <td><button className={s.clientCell} onClick={() => openApplication(row.id)}><OfficeBadge office={row.office} /><span><strong>{row.name}</strong><small>{row.id}</small></span></button></td>
                <td><DetailTrigger row={row} section="education" onOpen={() => openApplication(row.id, 'education')} /></td>
                <td><DetailTrigger row={row} section="service" onOpen={() => openApplication(row.id, 'service')} /></td>
                <td><Badge tone={row.stage === 'completed' ? 'green' : row.stage === 'processing' ? 'blue' : 'neutral'}><span className={s.statusDot} />{stageLabels[row.stage]}</Badge><small className={s.cellHint}>{row.stage === 'completed' ? 'Delivered' : row.documents.some(doc => doc.status === 'Missing') ? 'Awaiting documents' : row.documents.some(doc => doc.status === 'Received') ? 'Documents to review' : row.payment === 'pending' ? 'Awaiting payment' : 'Due ' + row.due}</small></td>
                <td><strong className={s.amount}>{money(row.amount)}</strong><small className={row.payment === 'paid' ? s.paymentPaid : s.paymentPending}>{row.payment === 'paid' ? <><CheckCheck size={12} />Paid</> : row.payment === 'refunded' ? 'Refunded' : 'Pending'}</small></td>
                <td className={s.updated}><time dateTime={row.updated}>{row.updated}</time></td>
                <td><button className={s.rowArrow} aria-label={'View ' + row.name} onClick={() => openApplication(row.id)}><ArrowUpRight size={17} /></button></td>
              </tr>)}
            </tbody></table></div>
            <div className={s.mobileCards}>{rows.map(row => <article className={s.mobileCard} key={row.id}>
              <button className={s.mobileIdentity} aria-label={'View ' + row.name} aria-haspopup="dialog" onClick={() => openApplication(row.id)}><OfficeBadge office={row.office} /><span><strong>{row.name}</strong><small>{row.id} · {row.office}</small></span><ArrowUpRight size={18} /></button>
              <dl className={s.mobileDetails}><div><dt>Education</dt><dd><DetailTrigger row={row} section="education" onOpen={() => openApplication(row.id, 'education')} /></dd></div><div><dt>Service</dt><dd><DetailTrigger row={row} section="service" onOpen={() => openApplication(row.id, 'service')} /></dd></div></dl>
              <footer><Badge tone={row.stage === 'completed' ? 'green' : row.stage === 'processing' ? 'blue' : 'neutral'}>{stageLabels[row.stage]}</Badge><span>{money(row.amount)} · {row.payment === 'paid' ? 'Paid' : row.payment === 'refunded' ? 'Refunded' : 'Pending'}</span></footer>
              <div className={s.mobileUpdated}><span>Updated</span><time dateTime={row.updated}>{row.updated}</time></div>
            </article>)}</div>
            {!filtered.length && <div className={s.empty}><Search size={30} /><h3>No applications found</h3><p>Try a different name, office, or status.</p><button className={s.secondaryButton} onClick={() => { setSearch(''); setOffice('all'); setFilter('all'); }}>Clear filters</button></div>}
            <div className={s.pagination}><span>Showing <strong>{filtered.length ? (visiblePage - 1) * perPage + 1 : 0}–{Math.min(visiblePage * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> applications</span><div><button aria-label="Previous page" disabled={visiblePage === 1} onClick={() => setPage(visiblePage - 1)}><ChevronLeft size={16} /></button>{Array.from({ length: pageCount }, (_, index) => <button key={index} className={visiblePage === index + 1 ? s.pageActive : ''} aria-label={'Page ' + (index + 1)} aria-current={visiblePage === index + 1 ? 'page' : undefined} onClick={() => setPage(index + 1)}>{index + 1}</button>)}<button aria-label="Next page" disabled={visiblePage === pageCount} onClick={() => setPage(visiblePage + 1)}><ChevronRight size={16} /></button></div></div>
          </>}

          {view === 'payments' && <div className={s.alternateList}>{visiblePayments.map(payment => {
            const row = applications.find(item => item.id === payment.applicationId)!;
            return <button key={payment.id} className={s.paymentRow} onClick={() => openApplication(row.id, 'payment')}><span className={s.fileIcon}><Link2 size={20} /></span><span className={s.paymentClient}><strong>{row.name}</strong><small>{payment.id} · {row.id}</small></span><span className={s.paymentMethod}>{payment.method}</span><Badge tone={payment.status === 'Paid' ? 'green' : payment.status === 'Draft' ? 'neutral' : 'amber'}>{payment.status}</Badge><strong className={s.paymentAmount}>{money(payment.amount)}</strong><ArrowUpRight size={17} /></button>;
          })}{!visiblePayments.length && <div className={s.empty}><CreditCard size={30} /><h3>No payment requests found</h3><p>Adjust your search or create a sample payment request.</p></div>}<p className={s.listNote}>Sample payment records. New requests are saved as preview drafts; no live payment links are created.</p></div>}

          {view === 'documents' && <div className={s.alternateList}>{scoped.filter(row => [row.name, row.id, row.service].join(' ').toLowerCase().includes(search.toLowerCase().trim())).map(row => <div className={s.documentGroup} key={row.id}><div className={s.documentHeading}><button onClick={() => openApplication(row.id, 'documents')}>{row.name}<ArrowUpRight size={14} /></button><span>{row.id} · {row.office}</span></div><div className={s.documentItems}>{row.documents.map(doc => <button className={s.documentItem} key={doc.name} onClick={() => openApplication(row.id, 'documents')}><FileText size={20} /><span>{doc.name}</span><Badge tone={doc.status === 'Reviewed' ? 'green' : doc.status === 'Missing' ? 'amber' : 'blue'}>{doc.status}</Badge></button>)}</div></div>)}{!scoped.some(row => [row.name, row.id, row.service].join(' ').toLowerCase().includes(search.toLowerCase().trim())) && <div className={s.empty}><FolderOpen size={30} /><h3>No documents found</h3><p>Try another client name or office.</p></div>}</div>}
        </section>
        <footer className={s.pageFooter}><span>AET Workspace <span> / </span> Client services</span><span>Interactive preview · Fictional records and amounts</span></footer>
      </main>
    </div>

    <PreviewDialog open={!!selected} onClose={() => setSelectedId(null)} title={selected ? selected.name + ' application details' : 'Application details'} drawer>
      {selected && <>
        <div className={s.detailIdentity}><OfficeBadge office={selected.office} large /><div><h2>{selected.name}</h2><p>{selected.id} <span>·</span> {selected.office}</p></div></div>
        <div className={s.detailBadges}><Badge tone="blue">{selected.service}</Badge><Badge tone={selected.stage === 'completed' ? 'green' : 'neutral'}>{stageLabels[selected.stage]}</Badge></div>
        <div className={s.detailTabs} role="group" aria-label="Application detail sections">{['overview', 'education', 'service', 'documents', 'payment', 'activity'].map(tab => <button key={tab} aria-pressed={detailTab === tab} className={detailTab === tab ? s.detailTabActive : ''} onClick={() => setDetailTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}</div>
        {detailTab === 'overview' && <div className={s.detailContent}>
          <section><h3>Application journey</h3><div className={s.journey}>{['Submitted', 'Documents', 'Payment', 'Completed'].map((step, index) => {
            const done = index === 0 || (index === 1 && selected.documents.every(doc => doc.status === 'Reviewed')) || (index === 2 && selected.payment === 'paid') || (index === 3 && selected.stage === 'completed');
            return <div key={step} className={done ? s.journeyDone : ''}><span>{done ? <Check size={13} /> : index + 1}</span><small>{step}</small></div>;
          })}</div></section>
          <section><h3>Client information</h3><dl className={s.detailGrid}><div><dt>Email</dt><dd>{selected.email}</dd></div><div><dt>Country of education</dt><dd>{selected.country}</dd></div><div><dt>Purpose</dt><dd>{selected.purpose}</dd></div><div><dt>Target completion</dt><dd>{selected.due}</dd></div><div><dt>Updated</dt><dd><time dateTime={selected.updated}>{selected.updated}</time></dd></div></dl></section>
          <section><h3>Manage application</h3><div className={s.formGrid}><label>Office<select value={selected.office} onChange={event => updateApplication({ office: event.target.value as Office }, 'Office updated')}>{offices.map(item => <option key={item}>{item}</option>)}</select></label><label>Status<select value={selected.stage} onChange={event => {
            const stage = event.target.value as Stage;
            if (['processing', 'completed'].includes(stage) && (selected.payment !== 'paid' || selected.documents.some(doc => doc.status !== 'Reviewed'))) {
              setFormError('Review all documents and confirm payment before moving this sample application forward.'); return;
            }
            setFormError(''); updateApplication({ stage }, 'Application status updated');
          }}>{Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>{formError && <p className={s.formError} role="alert">{formError}</p>}</section>
          <section><h3>Internal note</h3><form onSubmit={event => { event.preventDefault(); updateApplication({ notes: String(new FormData(event.currentTarget).get('notes')) }, 'Internal note saved'); }}><textarea className={s.noteInput} name="notes" aria-label="Internal note" key={selected.id} defaultValue={selected.notes} rows={3} /><button className={s.secondaryButton} type="submit">Save note</button></form></section>
        </div>}
        {detailTab === 'education' && <div className={s.detailContent}>
          <section><h3>Education history <span className={s.sectionCount}>{selected.educations.length}</span></h3><p className={s.helperText}>Fictional education records for this preview.</p>
            {selected.educations.map((education, index) => <article className={s.educationRecord} key={index}>
              <div className={s.educationHeading}><GraduationCap size={22} /><div><h3>{education.degree}</h3><p>{education.school}</p></div></div>
              <dl className={s.detailGrid}><div><dt>Country of study</dt><dd>{education.country}</dd></div><div><dt>Study period</dt><dd><time dateTime={education.start}>{education.start}</time> – <time dateTime={education.end}>{education.end}</time></dd></div></dl>
            </article>)}
            {!selected.educations.length && <div className={s.educationEmpty}><GraduationCap size={28} /><h3>No education records yet</h3><p>Education information has not been provided for this application.</p></div>}
          </section>
        </div>}
        {detailTab === 'service' && <div className={s.detailContent}>
          <section><h3>Requested service</h3><div className={s.serviceSummary}><FileCheck2 size={24} /><div><strong>{selected.service}</strong><p>{selected.purpose}</p></div></div>
            <dl className={s.detailGrid}><div><dt>Service</dt><dd>{selected.service}</dd></div><div><dt>Purpose</dt><dd>{selected.purpose}</dd></div><div><dt>Quoted amount</dt><dd>{money(selected.amount)}</dd></div><div><dt>Target completion</dt><dd>{selected.due}</dd></div><div><dt>Office</dt><dd>{selected.office}</dd></div><div><dt>Status</dt><dd>{stageLabels[selected.stage]}</dd></div></dl>
          </section>
          <button className={s.secondaryButton} onClick={() => setDetailTab('documents')}><FolderOpen size={17} />View supporting documents</button>
        </div>}
        {detailTab === 'documents' && <div className={s.detailContent}><section><h3>Application documents</h3><p className={s.helperText}>These are sample file records. No client documents are loaded.</p>{selected.documents.map((doc, index) => <div className={s.detailDocument} key={doc.name}><FileText size={24} /><div><strong>{doc.name}</strong><Badge tone={doc.status === 'Reviewed' ? 'green' : doc.status === 'Missing' ? 'amber' : 'blue'}>{doc.status}</Badge></div>{doc.status === 'Received' && <button className={s.smallButton} onClick={() => updateApplication({ documents: selected.documents.map((item, i) => i === index ? { ...item, status: 'Reviewed' } : item) }, 'Document marked as reviewed')}>Mark reviewed</button>}</div>)}</section><button className={s.secondaryButton} onClick={() => setDetailTab('reminder')}><Mail size={16} />Preview document reminder</button></div>}
        {detailTab === 'payment' && <div className={s.detailContent}><div className={s.paymentSummary}><span>Application quote</span><strong>{money(selected.amount)}</strong><Badge tone={selected.payment === 'paid' ? 'green' : 'amber'}>{selected.payment === 'paid' ? 'Paid' : selected.payment === 'refunded' ? 'Refunded' : 'Awaiting payment'}</Badge></div><section><h3>Payment requests</h3>{payments.filter(payment => payment.applicationId === selected.id).map(payment => <div className={s.detailPayment} key={payment.id}><div><strong>{payment.id}</strong><small>{payment.method} · {payment.status}</small></div><strong>{money(payment.amount)}</strong></div>)}{!payments.some(payment => payment.applicationId === selected.id) && <p className={s.helperText}>No payment request in this sample record.</p>}</section><p className={s.helperText}>Payments are for visual review only. No charge, refund, or payment confirmation can be made from this preview.</p><button className={s.secondaryButton} onClick={() => setDetailTab('reminder')}><Mail size={16} />Preview client email</button></div>}
        {detailTab === 'activity' && <div className={s.detailContent}><h3>Application activity</h3><div className={s.activity}>{(events[selected.id] || []).map((item, index) => <div key={index}><span className={s.activityDot} /><strong>{item}</strong><small>This preview session</small></div>)}<div><span className={s.activityDot} /><strong>Sample record added</strong><small>{selected.updated} · Demo workspace</small></div></div></div>}
        {detailTab === 'reminder' && <div className={s.detailContent}><button className={s.textButton} onClick={() => setDetailTab('overview')}><ArrowLeft size={14} />Back to overview</button><h3>Client email preview</h3><div className={s.emailPreview}><small>TO {selected.email}</small><strong>Your AET application · {selected.id}</strong><p>Hello {selected.name.split(' ')[0]},</p><p>Thank you for choosing AET. Please review your application status and any outstanding documents or payment requests.</p><p>Our team is here to help with the next step.</p><p>AET Client Services</p></div><p className={s.helperText}>Preview only. This email has not been sent.</p></div>}
        <div className={s.drawerFooter}><span className={s.previewPill}><span />Sample application</span><button className={s.textButton} onClick={() => setSelectedId(null)}>Back to list<ArrowRight size={15} /></button></div>
      </>}
    </PreviewDialog>

    <PreviewDialog open={modal !== null} onClose={() => setModal(null)} title={modal === 'new' ? 'New sample application' : modal === 'payment' ? 'New sample payment request' : modal === 'import' ? 'Import sample orders' : 'GPA calculator'}>
      {modal === 'new' && <><h2>New application</h2><p className={s.modalDescription}>Try adding a sample client. Changes stay in this preview.</p><form onSubmit={createApplication} className={s.form}><label>Client name<input name="name" placeholder="Alex Morgan" required maxLength={100} autoComplete="off" /></label><label>Email<input name="email" type="email" placeholder="alex@example.com" required maxLength={254} autoComplete="off" /></label><div className={s.formGrid}><label>Service<select name="service">{services.map(item => <option key={item}>{item}</option>)}</select></label><label>Office<select name="office">{offices.map(item => <option key={item}>{item}</option>)}</select></label><label>Purpose<select name="purpose"><option>Education</option><option>Employment</option><option>Immigration</option><option>Other</option></select></label><label>Quoted amount (USD)<input name="amount" type="number" min="0" max="999999" step="0.01" defaultValue="100" required /></label></div>{formError && <p className={s.formError} role="alert">{formError}</p>}<div className={s.formActions}><button type="button" className={s.secondaryButton} onClick={() => setModal(null)}>Cancel</button><button className={s.primaryButton} type="submit"><Plus size={16} />Add sample application</button></div></form></>}
      {modal === 'payment' && <><h2>New payment request</h2><p className={s.modalDescription}>Create a draft to preview the workflow. No live payment link or email is generated.</p><form onSubmit={createPayment} className={s.form}><label>Application<select name="application">{applications.filter(row => !['completed', 'cancelled'].includes(row.stage)).map(row => <option value={row.id} key={row.id}>{row.name} · {row.id}</option>)}</select></label><label>Requested amount (USD)<input name="amount" type="number" min="0.01" max="999999" step="0.01" defaultValue="100" required /></label>{formError && <p className={s.formError} role="alert">{formError}</p>}<div className={s.formActions}><button type="button" className={s.secondaryButton} onClick={() => setModal(null)}>Cancel</button><button className={s.primaryButton} type="submit">Save sample draft</button></div></form></>}
      {modal === 'import' && <><h2>Import orders</h2><p className={s.modalDescription}>Preview a small CSV import using fictional records. Up to 50 rows; simple comma-separated fields only.</p><form className={s.form} onSubmit={importOrders}><button type="button" className={s.secondaryButton} onClick={() => setCsv('name,email,service,office,amount\nAlex Morgan,alex@example.com,Document by Document,Boston,100\nJamie Park,jamie@example.com,Certified Translation,New York,120')}>Load sample CSV</button><label>CSV rows<textarea value={csv} onChange={event => setCsv(event.target.value)} rows={7} required spellCheck={false} placeholder="name,email,service,office,amount" /></label><p className={s.helperText}>Required columns: name, email, service, office, amount. Use sample data only.</p>{formError && <p className={s.formError} role="alert">{formError}</p>}<div className={s.formActions}><button type="button" className={s.secondaryButton} onClick={() => setModal(null)}>Cancel</button><button className={s.primaryButton} type="submit"><Upload size={16} />Import into preview</button></div></form></>}
      {modal === 'calculator' && <><h2>GPA calculator</h2><p className={s.modalDescription}>A weighted average on a 4.0 scale. This tool does not convert international grades or provide a credential evaluation.</p><div className={s.gpaRows}>{gpa.map((row, index) => <div className={s.gpaRow} key={index}><span>Course {index + 1}</span><label>Grade points<select value={row.grade} onChange={event => setGpa(current => current.map((item, i) => i === index ? { ...item, grade: event.target.value } : item))}>{[4, 3.7, 3.3, 3, 2.7, 2.3, 2, 1.7, 1.3, 1, 0].map(value => <option key={value}>{value}</option>)}</select></label><label>Credits<input type="number" min="0" max="30" step="0.5" value={row.credits} onChange={event => setGpa(current => current.map((item, i) => i === index ? { ...item, credits: String(Math.min(30, Math.max(0, Number(event.target.value)))) } : item))} /></label></div>)}</div><div className={s.gpaResult}><span>Weighted GPA<small>{totalCredits} total credits</small></span><strong>{gradeAverage}<small> / 4.00</small></strong></div></>}
    </PreviewDialog>
    <div role="status" aria-live="polite" className={toast ? s.toast : s.srOnly}>{toast && <CircleCheck size={18} />}{toast}</div>
  </div>;
}
