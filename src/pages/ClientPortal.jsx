import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import Thread from '../components/Thread.jsx'
import ComposeBar from '../components/ComposeBar.jsx'
import { initials, avatarColor, fmt$ } from '../utils.js'
import styles from './ClientPortal.module.css'

export default function ClientPortal() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [showInfo, setShowInfo] = useState(false)

  const getProjectByToken = useStore(s => s.getProjectByToken)
  const getMessages       = useStore(s => s.getMessages)
  const sendMessage       = useStore(s => s.sendMessage)
  const markMessagesRead  = useStore(s => s.markMessagesRead)
  const approveQuote      = useStore(s => s.approveQuote)
  const rejectQuote       = useStore(s => s.rejectQuote)
  const getQuote          = useStore(s => s.getQuote)

  const project = getProjectByToken(token)
  const messages = project ? getMessages(project.id) : []

  useEffect(() => {
    if (!project) return
    // Mark all rep messages as read when client opens portal
    markMessagesRead(project.id, 'rep')
  }, [project?.id])

  if (!project || !project.portalEnabled) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorIcon}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L28 10V16C28 23 22 28.5 16 30C10 28.5 4 23 4 16V10L16 4Z" fill="white"/>
          </svg>
        </div>
        <div className={styles.errorTitle}>Portal unavailable</div>
        <div className={styles.errorSub}>
          This portal link has been deactivated. Contact your rep for a new link.
        </div>
      </div>
    )
  }

  const handleSend = (text) => {
    sendMessage({ projectId: project.id, sender: 'client', type: 'text', text })
  }

  const handleAttach = (type) => {
    // Simulate file upload for now — in production this opens file picker
    const fileName = type === 'photo' ? 'photo_' + Date.now() + '.jpg' : 'document_' + Date.now() + '.pdf'
    const fileType = type === 'photo' ? 'image' : 'pdf'
    sendMessage({
      projectId: project.id,
      sender: 'client',
      type: type === 'photo' ? 'photo' : 'file',
      fileName,
      fileSize: '1.2 MB',
      fileType,
    })
  }

  const handleApproveQuote = (quoteId) => {
    approveQuote(quoteId)
    sendMessage({
      projectId: project.id,
      sender: 'client',
      type: 'status_update',
      text: `Quote approved ✓`,
    })
  }

  const handleRejectQuote = (quoteId) => {
    rejectQuote(quoteId)
    sendMessage({
      projectId: project.id,
      sender: 'client',
      type: 'status_update',
      text: 'Quote declined',
    })
  }

  const repInitials = initials(project.repName)
  const repColor = avatarColor(project.repName)

  return (
    <div className={styles.shell}>
      {/* Safe area top */}
      <div className={styles.safeTop} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatar} style={{ background: repColor }}>
          {repInitials}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{project.repName}</div>
          <div className={styles.headerSub}>{project.repCompany}</div>
        </div>
        <button className={styles.infoBtn} onClick={() => setShowInfo(v => !v)} aria-label="Project info">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="7.5"/>
            <line x1="9" y1="8" x2="9" y2="13"/>
            <circle cx="9" cy="5.5" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>

      {/* Project banner */}
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l2.5 2.5L10 3"/>
          </svg>
        </div>
        <div className={styles.bannerText}>
          <div className={styles.bannerLabel}>Your project</div>
          {project.projectName}{project.projectDesc ? ` — ${project.projectDesc}` : ''}
        </div>
      </div>

      {/* Info panel (expandable) */}
      {showInfo && (
        <div className={styles.infoPanel}>
          <div className={styles.infoRow}>
            <span>Project</span><span>{project.projectName}</span>
          </div>
          {project.projectDesc && (
            <div className={styles.infoRow}>
              <span>Description</span><span>{project.projectDesc}</span>
            </div>
          )}
          <div className={styles.infoRow}>
            <span>Rep</span><span>{project.repName}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Company</span><span>{project.repCompany}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Status</span>
            <span className={styles.statusPill}>{project.status}</span>
          </div>
        </div>
      )}

      {/* Thread */}
      <Thread
        messages={messages}
        perspective="client"
        onApproveQuote={handleApproveQuote}
        onRejectQuote={handleRejectQuote}
        getQuote={getQuote}
      />

      {/* Compose */}
      <ComposeBar
        onSend={handleSend}
        onAttach={handleAttach}
        placeholder={`Message ${project.repName}...`}
      />
    </div>
  )
}
