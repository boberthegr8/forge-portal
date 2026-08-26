import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, Building2, CalendarDays, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, FileText, LogOut, MessageSquareText, PackageCheck,
  RefreshCw, ShieldCheck, Truck, XCircle
} from 'lucide-react';
import {
  createPortalDocumentUrl, forgeCore, getPortalSession, loadPortalDashboard,
  loadPortalQuoteResponses, sendPortalMagicLink, signOutPortal,
  submitPortalQuoteResponse, type PortalDashboard, type PortalDocument,
  type PortalProject, type PortalQuote, type PortalQuoteResponse
} from './portalCore';

type Tab = 'overview' | 'quotes' | 'documents' | 'deliveries';
type ResponseChoice = PortalQuoteResponse['response'];

const money = (value?: number, currency = 'CAD') => new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value || 0));
const dateTime = (value?: string) => value ? new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'Not scheduled';
const label = (value?: string) => (value || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
const addressText = (value?: Record<string, unknown>) => value ? [value.line1, value.line2, value.city, value.province || value.state, value.postal_code || value.postalCode].filter(Boolean).join(', ') : '';

export default function App() {
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [dashboard, setDashboard] = useState<PortalDashboard>({ grants: [], projects: [] });
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [responses, setResponses] = useState<PortalQuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [responseQuote, setResponseQuote] = useState<PortalQuote | null>(null);
  const [responseChoice, setResponseChoice] = useState<ResponseChoice>('approved');
  const [responseNote, setResponseNote] = useState('');

  const selected = useMemo(() => dashboard.projects.find(project => project.id === selectedId) || dashboard.projects[0] || null, [dashboard.projects, selectedId]);
  const latestResponses = useMemo(() => {
    const map = new Map<string, PortalQuoteResponse>();
    for (const item of responses) if (!map.has(item.quote_id)) map.set(item.quote_id, item);
    return map;
  }, [responses]);

  const refresh = async () => {
    setLoading(true); setError('');
    try {
      const next = await loadPortalDashboard();
      setDashboard(next);
      setSelectedId(current => next.projects.some(project => project.id === current) ? current : next.projects[0]?.id || '');
    } catch (err: any) {
      setError(err?.message || 'Could not load your Forge Portal.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let unsubscribe = () => {};
    void getPortalSession().then(session => {
      setSignedIn(Boolean(session));
      setSessionEmail(session?.user.email || '');
      if (session) void refresh(); else setLoading(false);
    }).catch(err => { setError(err?.message || 'Could not restore your session.'); setLoading(false); });
    const { data } = forgeCore.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      setSessionEmail(session?.user.email || '');
      if (session) window.setTimeout(() => void refresh(), 0);
      else { setDashboard({ grants: [], projects: [] }); setLoading(false); }
    });
    unsubscribe = () => data.subscription.unsubscribe();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selected?.id) { setResponses([]); return; }
    void loadPortalQuoteResponses(selected.id).then(setResponses).catch(() => setResponses([]));
  }, [selected?.id]);

  const sendLink = async () => {
    if (!email.trim()) return;
    setBusy(true); setError(''); setMessage('');
    try { await sendPortalMagicLink(email); setMessage('Sign-in link sent. Open the email on this device to enter your Portal.'); }
    catch (err: any) { setError(err?.message || 'Could not send sign-in link.'); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    setBusy(true);
    try { await signOutPortal(); setDashboard({ grants: [], projects: [] }); }
    catch (err: any) { setError(err?.message || 'Could not sign out.'); }
    finally { setBusy(false); }
  };

  const downloadDocument = async (document: PortalDocument) => {
    setBusy(true); setError('');
    try { const url = await createPortalDocumentUrl(document); window.open(url, '_blank', 'noopener,noreferrer'); }
    catch (err: any) { setError(err?.message || 'Document could not be opened.'); }
    finally { setBusy(false); }
  };

  const submitResponse = async () => {
    if (!responseQuote) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await submitPortalQuoteResponse(responseQuote.id, responseChoice, responseNote);
      setMessage(`Your ${label(responseChoice).toLowerCase()} response was recorded for ${responseQuote.quote_number || 'the quote'}.`);
      if (selected) setResponses(await loadPortalQuoteResponses(selected.id));
      setResponseQuote(null); setResponseNote(''); setResponseChoice('approved');
    } catch (err: any) { setError(err?.message || 'Could not record your quote response.'); }
    finally { setBusy(false); }
  };

  if (loading && !signedIn) return <div className="screen-center"><div className="loader" /><span>Opening Forge Portal…</span></div>;

  if (!signedIn) return <div className="auth-shell">
    <div className="auth-brand"><div className="brand-mark">F</div><div><strong>FORGE</strong><span>Customer Portal</span></div></div>
    <section className="auth-card">
      <div className="shield"><ShieldCheck size={28} /></div>
      <div className="eyebrow">Secure project access</div>
      <h1>Your job. One place.</h1>
      <p>View shared projects, current quotes, documents and delivery information using your passwordless Forge account.</p>
      {error && <div className="alert danger">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      <label className="field"><span>Email address</span><input type="email" value={email} onChange={event => setEmail(event.target.value)} onKeyDown={event => event.key === 'Enter' && void sendLink()} placeholder="you@company.com" autoComplete="email" /></label>
      <button className="primary full" onClick={() => void sendLink()} disabled={busy || !email.trim()}>Send secure sign-in link</button>
      <small className="privacy-note">Forge Portal only shows records that have been explicitly shared with your account.</small>
    </section>
  </div>;

  if (!loading && !dashboard.projects.length) return <div className="auth-shell">
    <div className="auth-brand"><div className="brand-mark">F</div><div><strong>FORGE</strong><span>Customer Portal</span></div></div>
    <section className="auth-card empty-access"><div className="shield"><ShieldCheck size={28} /></div><div className="eyebrow">Signed in securely</div><h1>No projects shared yet.</h1><p>Your Forge Core account is active, but no customer or project access has been assigned to <strong>{sessionEmail}</strong>.</p><p>Contact your sales representative and ask them to share the project with this email address.</p><button className="secondary full" onClick={() => void logout()} disabled={busy}><LogOut size={15} />Sign out</button></section>
  </div>;

  return <div className="portal-shell">
    <aside className="sidebar">
      <div className="portal-brand"><div className="brand-mark small">F</div><div><strong>FORGE</strong><span>Portal</span></div></div>
      <div className="nav-label">Shared projects</div>
      <div className="project-nav">{dashboard.projects.map(project => <button key={project.id} className={selected?.id === project.id ? 'project-link active' : 'project-link'} onClick={() => { setSelectedId(project.id); setTab('overview'); }}><div><strong>{project.name || 'Untitled project'}</strong><span>{project.project_number || project.customer_name || 'Project'}</span></div><ChevronRight size={15} /></button>)}</div>
      <div className="sidebar-footer"><div><ShieldCheck size={14} /><span>Secured by Forge Core</span></div><small>{sessionEmail}</small><button onClick={() => void logout()} disabled={busy}><LogOut size={14} />Sign out</button></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><div className="eyebrow">{selected?.organization_name || 'Forge Portal'}</div><h1>{selected?.name}</h1><p>{selected?.customer_name}{selected?.project_number ? ` · ${selected.project_number}` : ''}</p></div><button className="secondary" onClick={() => void refresh()} disabled={busy || loading}><RefreshCw size={15} className={loading ? 'spin' : ''} />Refresh</button></header>
      <div className="content">
        {error && <div className="alert danger">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        {selected && <PortalProjectView project={selected} tab={tab} setTab={setTab} latestResponses={latestResponses} onDownload={downloadDocument} onRespond={quote => { setResponseQuote(quote); setResponseChoice('approved'); setResponseNote(''); }} />}
      </div>
    </main>

    {responseQuote && <ResponseModal quote={responseQuote} choice={responseChoice} setChoice={setResponseChoice} note={responseNote} setNote={setResponseNote} busy={busy} onClose={() => setResponseQuote(null)} onSubmit={() => void submitResponse()} />}
  </div>;
}

function PortalProjectView({ project, tab, setTab, latestResponses, onDownload, onRespond }: { project: PortalProject; tab: Tab; setTab: (tab: Tab) => void; latestResponses: Map<string, PortalQuoteResponse>; onDownload: (doc: PortalDocument) => void; onRespond: (quote: PortalQuote) => void }) {
  const nextDelivery = project.deliveries.filter(item => item.scheduled_start && new Date(item.scheduled_start) >= new Date()).sort((a,b) => String(a.scheduled_start).localeCompare(String(b.scheduled_start)))[0];
  return <>
    <section className="summary-grid">
      <div className="summary"><span><CircleDollarSign size={15} />Quotes</span><strong>{project.quotes.length}</strong><small>{project.permissions.approve ? 'Response access enabled' : 'View only'}</small></div>
      <div className="summary"><span><FileText size={15} />Documents</span><strong>{project.documents.length}</strong><small>Shared project files</small></div>
      <div className="summary"><span><Truck size={15} />Deliveries</span><strong>{project.deliveries.length}</strong><small>{nextDelivery ? dateTime(nextDelivery.scheduled_start) : 'No upcoming delivery'}</small></div>
      <div className="summary"><span><Building2 size={15} />Status</span><strong className="status-text">{label(project.status)}</strong><small>{addressText(project.address) || 'Project record'}</small></div>
    </section>
    <nav className="tabs">{(['overview','quotes','documents','deliveries'] as Tab[]).map(item => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{label(item)}</button>)}</nav>
    {tab === 'overview' && <Overview project={project} nextDelivery={nextDelivery} />}
    {tab === 'quotes' && <Quotes project={project} responses={latestResponses} onRespond={onRespond} />}
    {tab === 'documents' && <Documents project={project} onDownload={onDownload} />}
    {tab === 'deliveries' && <Deliveries project={project} />}
  </>;
}

function Overview({ project, nextDelivery }: { project: PortalProject; nextDelivery?: PortalProject['deliveries'][number] }) {
  const latestQuote = [...project.quotes].sort((a,b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0];
  return <div className="two-col">
    <section className="panel"><div className="panel-head"><h2>Project overview</h2><span>{label(project.status)}</span></div><div className="detail-list"><div><span>Project</span><strong>{project.name}</strong></div><div><span>Project #</span><strong>{project.project_number || '—'}</strong></div><div><span>Customer</span><strong>{project.customer_name || '—'}</strong></div><div><span>Site</span><strong>{addressText(project.address) || '—'}</strong></div></div>{project.description && <p className="description">{project.description}</p>}</section>
    <section className="panel"><div className="panel-head"><h2>Current activity</h2><span>Live</span></div><div className="activity-list"><div className="activity"><div className="activity-icon"><CircleDollarSign size={17} /></div><div><strong>{latestQuote ? `Quote ${latestQuote.quote_number || ''}` : 'No shared quote'}</strong><span>{latestQuote ? `${label(latestQuote.status)} · ${money(latestQuote.total, latestQuote.currency)}` : 'Your representative has not shared a quote yet.'}</span></div></div><div className="activity"><div className="activity-icon"><Truck size={17} /></div><div><strong>{nextDelivery ? 'Next delivery' : 'No upcoming delivery'}</strong><span>{nextDelivery ? `${dateTime(nextDelivery.scheduled_start)} · ${label(nextDelivery.status)}` : 'Nothing is currently scheduled.'}</span></div></div><div className="activity"><div className="activity-icon"><FileText size={17} /></div><div><strong>{project.documents.length} shared document{project.documents.length === 1 ? '' : 's'}</strong><span>Plans, quotes and project files shared through Forge Core.</span></div></div></div></section>
  </div>;
}

function Quotes({ project, responses, onRespond }: { project: PortalProject; responses: Map<string, PortalQuoteResponse>; onRespond: (quote: PortalQuote) => void }) {
  if (!project.permissions.quotes) return <Empty icon={<CircleDollarSign />} title="Quotes are not enabled" text="Your Portal access does not include quote visibility for this project." />;
  if (!project.quotes.length) return <Empty icon={<CircleDollarSign />} title="No shared quotes" text="There are no quote records currently shared for this project." />;
  return <div className="stack">{project.quotes.map(quote => { const response = responses.get(quote.id); return <article className="quote-card" key={quote.id}><div className="quote-main"><div className="quote-number">{quote.quote_number || 'Quote'}{quote.current_revision ? <span>Rev {quote.current_revision}</span> : null}</div><h3>{quote.title || project.name}</h3><div className="quote-meta"><span>{label(quote.status)}</span><span>{quote.quote_date || 'No quote date'}</span>{quote.expiry_date && <span>Expires {quote.expiry_date}</span>}</div></div><div className="quote-total"><small>Total</small><strong>{money(quote.total, quote.currency)}</strong></div><div className="quote-actions">{response && <div className={`response-pill ${response.response}`}>{response.response === 'approved' ? <CheckCircle2 size={14}/> : response.response === 'declined' ? <XCircle size={14}/> : <MessageSquareText size={14}/>}Your response: {label(response.response)}</div>}{project.permissions.approve && <button className="primary compact" onClick={() => onRespond(quote)}>Respond to quote</button>}</div></article>})}</div>;
}

function Documents({ project, onDownload }: { project: PortalProject; onDownload: (doc: PortalDocument) => void }) {
  if (!project.permissions.documents) return <Empty icon={<FileText />} title="Documents are not enabled" text="Your Portal access does not include project document visibility." />;
  if (!project.documents.length) return <Empty icon={<FileText />} title="No shared documents" text="There are no project files shared with your account yet." />;
  return <section className="panel list-panel"><div className="list-header"><span>Document</span><span>Type</span><span>Added</span><span /></div>{project.documents.map(doc => <div className="document-row" key={doc.id}><div className="file-name"><div className="file-icon"><FileText size={17}/></div><div><strong>{doc.title || doc.original_filename || 'Document'}</strong><span>{doc.original_filename}</span></div></div><span>{label(doc.document_type)}</span><span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-CA') : '—'}</span><button className="secondary compact" onClick={() => onDownload(doc)}><ArrowDownToLine size={14}/>Open</button></div>)}</section>;
}

function Deliveries({ project }: { project: PortalProject }) {
  if (!project.permissions.deliveries) return <Empty icon={<Truck />} title="Deliveries are not enabled" text="Your Portal access does not include delivery visibility." />;
  if (!project.deliveries.length) return <Empty icon={<Truck />} title="No shared deliveries" text="No deliveries are currently associated with this project." />;
  return <div className="stack">{project.deliveries.map(delivery => <article className="delivery-card" key={delivery.id}><div className="delivery-icon"><Truck size={20}/></div><div className="delivery-main"><div><strong>{delivery.delivery_number || 'Delivery'}</strong><span className={`badge ${String(delivery.status || '')}`}>{label(delivery.status)}</span></div><p>{dateTime(delivery.scheduled_start)}</p><small>{addressText(delivery.address) || project.name}</small></div><div className="delivery-detail"><span>{label(delivery.direction)}</span>{delivery.load_type && <span>{label(delivery.load_type)}</span>}{delivery.truck && <span>{delivery.truck}</span>}{delivery.driver && <span>{delivery.driver}</span>}</div></article>)}</div>;
}

function ResponseModal({ quote, choice, setChoice, note, setNote, busy, onClose, onSubmit }: { quote: PortalQuote; choice: ResponseChoice; setChoice: (value: ResponseChoice) => void; note: string; setNote: (value: string) => void; busy: boolean; onClose: () => void; onSubmit: () => void }) {
  return <div className="modal-backdrop"><section className="modal"><div className="modal-head"><div><div className="eyebrow">Quote response</div><h2>{quote.quote_number || 'Quote'} · {money(quote.total, quote.currency)}</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="choice-grid"><button className={choice === 'approved' ? 'choice selected approve' : 'choice approve'} onClick={() => setChoice('approved')}><CheckCircle2 size={20}/><strong>Approve</strong><span>Record my approval</span></button><button className={choice === 'changes_requested' ? 'choice selected changes' : 'choice changes'} onClick={() => setChoice('changes_requested')}><MessageSquareText size={20}/><strong>Request changes</strong><span>Send comments back</span></button><button className={choice === 'declined' ? 'choice selected decline' : 'choice decline'} onClick={() => setChoice('declined')}><XCircle size={20}/><strong>Decline</strong><span>Record that I am declining</span></button></div><label className="field"><span>Note {choice === 'changes_requested' ? '(recommended)' : '(optional)'}</span><textarea rows={5} value={note} onChange={event => setNote(event.target.value)} placeholder="Add any details for your representative…" /></label><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy} onClick={onSubmit}>Submit response</button></div><small className="audit-note">Your response is recorded as an immutable Portal action. Your representative remains responsible for the internal quote workflow.</small></section></div>;
}

function Empty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="empty"><div>{icon}</div><strong>{title}</strong><span>{text}</span></div>;
}
