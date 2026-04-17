import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import Thread from '../components/Thread.jsx'
import ComposeBar from '../components/ComposeBar.jsx'
import QuoteCard from '../components/QuoteCard.jsx'
import { initials, avatarColor, fmt$, portalUrl, copyToClipboard, timeAgo } from '../utils.js'
import styles from './RepView.module.css'

// ── SEND QUOTE MODAL ───────────────────────────────────────────
function SendQuoteModal({ project, onClose, onSend }) {
  const [number, setNumber]   = useState('Q-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*900)+100))
  const [items, setItems]     = useState([{ label: '', amount: '' }])
  const [notes, setNotes]     = useState('30-day payment terms.')

  const addLine = () => setItems(v => [...v, { label: '', amount: '' }])
  const removeLine = (i) => setItems(v => v.filter((_, idx) => idx !== i))
  const updateLine = (i, field, val) =>
    setItems(v => v.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const total = items.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0)

  const handleSend = () => {
    const lineItems = items
      .filter(li => li.label && li.amount)
      .map(li => ({ label: li.label, amount: parseFloat(li.amount) }))
    if (!lineItems.length) return
    onSend({ number, lineItems, notes })
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Send quote</div>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.fieldRow}>
            <label className={styles.label}>Quote number</label>
            <input className={styles.input} value={number} onChange={e => setNumber(e.target.value)} />
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>Line items</label>
            {items.map((li, i) => (
              <div key={i} className={styles.lineRow}>
                <input
                  className={styles.input}
                  placeholder="Description"
                  value={li.label}
                  onChange={e => updateLine(i, 'label', e.target.value)}
                  style={{ flex: 2 }}
                />
                <input
                  className={styles.input}
                  placeholder="0.00"
                  type="number"
                  value={li.amount}
                  onChange={e => updateLine(i, 'amount', e.target.value)}
                  style={{ flex: 1 }}
                />
                {items.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => removeLine(i)}>×</button>
                )}
              </div>
            ))}
            <button className={styles.addLineBtn} onClick={addLine}>+ Add line</button>
          </div>

          <div className={styles.totalPreview}>
            <span>Total</span>
            <span>{fmt$(total)}</span>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.label}>Notes / terms</label>
            <textarea className={styles.textarea} value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleSend}>Send to client</button>
        </div>
      </div>
    </div>
  )
}

// ── NEW PROJECT MODAL ─────────────────────────────────────────
function NewProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', projectName: '',
    projectDesc: '', repName: 'Rob Flagg', repCompany: 'Forge Building Group'
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = () => {
    if (!form.clientName || !form.projectName) return
    onCreate(form)
    onClose()
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>New project portal</div>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.fieldRow2}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Client name</label>
              <input className={styles.input} placeholder="Sarah Johnson" value={form.clientName} onChange={e => set('clientName', e.target.value)} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Client email</label>
              <input className={styles.input} placeholder="sarah@example.com" type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} />
            </div>
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>Project name</label>
            <input className={styles.input} placeholder="Johnson Residence" value={form.projectName} onChange={e => set('projectName', e.target.value)} />
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.label}>Description</label>
            <input className={styles.input} placeholder="1,840 sq ft bungalow — truss package" value={form.projectDesc} onChange={e => set('projectDesc', e.target.value)} />
          </div>
          <div className={styles.fieldRow2}>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Your name</label>
              <input className={styles.input} value={form.repName} onChange={e => set('repName', e.target.value)} />
            </div>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Company</label>
              <input className={styles.input} value={form.repCompany} onChange={e => set('repCompany', e.target.value)} />
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={handleCreate}>Create portal</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN REP VIEW ─────────────────────────────────────────────
export default function RepView() {
  const [selectedId, setSelectedId]     = useState(1)
  const [showQuoteModal, setQuoteModal] = useState(false)
  const [showNewModal, setNewModal]     = useState(false)
  const [copied, setCopied]             = useState(false)

  const projects        = useStore(s => s.projects)
  const getMessages     = useStore(s => s.getMessages)
  const sendMessage     = useStore(s => s.sendMessage)
  const createProject   = useStore(s => s.createProject)
  const createQuote     = useStore(s => s.createQuote)
  const getQuote        = useStore(s => s.getQuote)
  const getUnreadCount  = useStore(s => s.getUnreadCount)
  const togglePortal    = useStore(s => s.togglePortal)
  const approveQuote    = useStore(s => s.approveQuote)
  const rejectQuote     = useStore(s => s.rejectQuote)
  const markMessagesRead = useStore(s => s.markMessagesRead)

  const project  = projects.find(p => p.id === selectedId)
  const messages = project ? getMessages(project.id) : []

  const handleSelectProject = (id) => {
    setSelectedId(id)
    markMessagesRead(id, 'client')
  }

  const handleSend = (text) => {
    if (!project) return
    sendMessage({ projectId: project.id, sender: 'rep', type: 'text', text })
  }

  const handleAttach = (type) => {
    if (!project) return
    const fileName = type === 'photo' ? 'photo_' + Date.now() + '.jpg' : 'plan_' + Date.now() + '.pdf'
    sendMessage({
      projectId: project.id, sender: 'rep',
      type: type === 'photo' ? 'photo' : 'file',
      fileName, fileSize: '2.1 MB',
      fileType: type === 'photo' ? 'image' : 'pdf',
    })
  }

  const handleSendQuote = ({ number, lineItems, notes }) => {
    if (!project) return
    const quote = createQuote({ projectId: project.id, number, lineItems, notes })
    sendMessage({ projectId: project.id, sender: 'rep', type: 'quote', quoteId: quote.id })
  }

  const handleCopyLink = async () => {
    if (!project) return
    await copyToClipboard(portalUrl(project.token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateProject = (form) => {
    const p = createProject(form)
    setSelectedId(p.id)
  }

  // Approval notification check
  const approvalPending = project?.activeQuoteId
    ? (() => { const q = getQuote(project.activeQuoteId); return q?.status === 'approved' })()
    : false

  return (
    <div className={styles.shell}>
      {/* ── TOP BAR ── */}
      <div className={styles.topbar}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="white">
              <path d="M9 1L16 5V9C16 13 12.5 16.5 9 17C5.5 16.5 2 13 2 9V5L9 1Z"/>
            </svg>
          </div>
          <span className={styles.logoText}>Forge <span>Portal</span></span>
        </div>
        <button className={styles.newBtn} onClick={() => setNewModal(true)}>
          + New portal
        </button>
      </div>

      <div className={styles.layout}>
        {/* ── LEFT: PROJECT LIST ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span>Projects</span>
            <span className={styles.projectCount}>{projects.length}</span>
          </div>

          <div className={styles.projectList}>
            {projects.map(p => {
              const unread = getUnreadCount(p.id, 'client')
              const msgs   = getMessages(p.id)
              const last   = msgs[msgs.length - 1]
              const isSelected = p.id === selectedId

              return (
                <div
                  key={p.id}
                  className={`${styles.projectItem} ${isSelected ? styles.projectItemActive : ''}`}
                  onClick={() => handleSelectProject(p.id)}
                >
                  <div className={styles.projectAvatar} style={{ background: avatarColor(p.clientName) }}>
                    {initials(p.clientName)}
                  </div>
                  <div className={styles.projectMeta}>
                    <div className={styles.projectItemTop}>
                      <span className={styles.projectClientName}>{p.clientName}</span>
                      {last && <span className={styles.projectTime}>{timeAgo(last.ts)}</span>}
                    </div>
                    <div className={styles.projectItemBottom}>
                      <span className={styles.projectNameSub}>{p.projectName}</span>
                      {unread > 0 && (
                        <span className={styles.unreadBadge}>{unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: THREAD PANEL ── */}
        {project ? (
          <div className={styles.main}>
            {/* Thread header */}
            <div className={styles.threadHeader}>
              <div className={styles.threadHeaderLeft}>
                <div className={styles.threadAvatar} style={{ background: avatarColor(project.clientName) }}>
                  {initials(project.clientName)}
                </div>
                <div>
                  <div className={styles.threadClientName}>{project.clientName}</div>
                  <div className={styles.threadProjectName}>{project.projectName}</div>
                </div>
              </div>
              <div className={styles.threadHeaderActions}>
                <button
                  className={styles.actionBtn}
                  onClick={handleCopyLink}
                  title="Copy portal link"
                >
                  {copied ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--forge)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7.5l3.5 3.5 7-7"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="1" width="9" height="9" rx="2"/>
                      <path d="M10 10v3a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1h3"/>
                    </svg>
                  )}
                  <span>{copied ? 'Copied!' : 'Copy link'}</span>
                </button>
                <button
                  className={`${styles.actionBtn} ${!project.portalEnabled ? styles.actionBtnDanger : ''}`}
                  onClick={() => togglePortal(project.id)}
                  title={project.portalEnabled ? 'Disable portal' : 'Enable portal'}
                >
                  {project.portalEnabled ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="9" height="8" rx="1.5"/>
                      <path d="M10 7h2.5a1 1 0 011 1v4a1 1 0 01-1 1H10"/>
                      <path d="M4 4V3a3 3 0 016 0v1"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="9" height="8" rx="1.5"/>
                      <path d="M4 4V3a3 3 0 016 0v1"/>
                      <line x1="2" y1="2" x2="13" y2="13"/>
                    </svg>
                  )}
                  <span>{project.portalEnabled ? 'Portal on' : 'Portal off'}</span>
                </button>
              </div>
            </div>

            {/* Approval notification */}
            {approvalPending && (
              <div className={styles.approvalBanner}>
                <div className={styles.approvalDot} />
                <div className={styles.approvalText}>
                  <strong>{project.clientName}</strong> approved the quote
                </div>
                <button className={styles.approvalBtn} onClick={() => approveQuote(project.activeQuoteId)}>
                  Confirm
                </button>
              </div>
            )}

            {/* Portal link card (shown when no messages yet) */}
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--forge)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div className={styles.emptyTitle}>Portal created</div>
                <div className={styles.emptySub}>Share this link with {project.clientName} to get started</div>
                <div className={styles.linkBox}>
                  <span className={styles.linkText}>{portalUrl(project.token)}</span>
                  <button className={styles.copyLinkBtn} onClick={handleCopyLink}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Thread */}
            {messages.length > 0 && (
              <Thread
                messages={messages}
                perspective="rep"
                onApproveQuote={approveQuote}
                onRejectQuote={rejectQuote}
                getQuote={getQuote}
              />
            )}

            {/* Compose */}
            <ComposeBar
              onSend={handleSend}
              onAttach={handleAttach}
              onSendQuote={() => setQuoteModal(true)}
              showQuoteBtn={true}
              placeholder={`Message ${project.clientName}...`}
            />
          </div>
        ) : (
          <div className={styles.noSelection}>
            <div className={styles.noSelectionText}>Select a project to view the thread</div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showQuoteModal && (
        <SendQuoteModal
          project={project}
          onClose={() => setQuoteModal(false)}
          onSend={handleSendQuote}
        />
      )}
      {showNewModal && (
        <NewProjectModal
          onClose={() => setNewModal(false)}
          onCreate={handleCreateProject}
        />
      )}
    </div>
  )
}
