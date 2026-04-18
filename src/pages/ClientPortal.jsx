import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import Thread from '../components/Thread.jsx'
import ComposeBar from '../components/ComposeBar.jsx'
import { initials, avatarColor } from '../utils.js'
import styles from './ClientPortal.module.css'

export default function ClientPortal() {
  const { token } = useParams()
  const [showInfo, setShowInfo] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProjects     = useStore(s => s.fetchProjects)
  const fetchMessages     = useStore(s => s.fetchMessages)
  const fetchQuotes       = useStore(s => s.fetchQuotes)
  const getProjectByToken = useStore(s => s.getProjectByToken)
  const getMessages       = useStore(s => s.getMessages)
  const sendMessage       = useStore(s => s.sendMessage)
  const markMessagesRead  = useStore(s => s.markMessagesRead)
  const approveQuote      = useStore(s => s.approveQuote)
  const rejectQuote       = useStore(s => s.rejectQuote)
  const getQuote          = useStore(s => s.getQuote)
  const subscribeToProject = useStore(s => s.subscribeToProject)

  const project = getProjectByToken(token)
  const messages = project ? getMessages(project.id) : []

  useEffect(() => {
    const init = async () => {
      await fetchProjects()
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!project) return
    fetchMessages(project.id)
    fetchQuotes(project.id)
    markMessagesRead(project.id, 'rep')
    const unsub = subscribeToProject(project.id)
    return unsub
  }, [project?.id])

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.errorIcon}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L28 10V16C28 23 22 28.5 16 30C10 28.5 4 23 4 16V10L16 4Z" fill="white"/>
          </svg>
        </div>
        <div className={styles.errorTitle}>Loading your portal...</div>
      </div>
    )
  }

  if (!project || !project.portal_enabled) {
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
    const fileName = type === 'photo' ? 'photo_' + Date.now() + '.jpg' : 'document_' + Date.now() + '.pdf'
    sendMessage({
      projectId: project.id, sender: 'client',
      type: type === 'photo' ? 'photo' : 'file',
      fileName, fileSize: '1.2 MB',
      fileType: type === 'photo' ? 'image' : 'pdf',
    })
  }

  const handleApproveQuote = async (quoteId) => {
    await approveQuote(quoteId)
    sendMessage({ projectId: project.id, sender: 'client', type: 'status_update', text: 'Quote approved ✓' })
  }

  const handleRejectQuote = async (quoteId) => {
    await rejectQuote(quoteId)
    sendMessage({ projectId: project.id, sender: 'client', type: 'status_update', text: 'Quote declined' })
  }

  return (
    <div className={styles.shell}>
      <div className={styles.safeTop} />
      <div className={styles.header}>
        <div className={styles.avatar} style={{ background: avatarColor(project.rep_name) }}>
          {initials(project.rep_name)}
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{project.rep_name}</div>
          <div className={styles.headerSub}>{project.rep_company}</div>
        </div>
        <button className={styles.infoBtn} onClick={() => setShowInfo(v => !v)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="7.5"/>
            <line x1="9" y1="8" x2="9" y2="13"/>
            <circle cx="9" cy="5.5" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>

      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l2.5 2.5L10 3"/>
          </svg>
        </div>
        <div className={styles.bannerText}>
          <div className={styles.bannerLabel}>Your project</div>
          {project.project_name}{project.project_desc ? ` — ${project.project_desc}` : ''}
        </div>
      </div>

      {showInfo && (
        <div className={styles.infoPanel}>
          <div className={styles.infoRow}><span>Project</span><span>{project.project_name}</span></div>
          {project.project_desc && <div className={styles.infoRow}><span>Description</span><span>{project.project_desc}</span></div>}
          <div className={styles.infoRow}><span>Rep</span><span>{project.rep_name}</span></div>
          <div className={styles.infoRow}><span>Company</span><span>{project.rep_company}</span></div>
          <div className={styles.infoRow}><span>Status</span><span className={styles.statusPill}>{project.status}</span></div>
        </div>
      )}

      <Thread
        messages={messages}
        perspective="client"
        onApproveQuote={handleApproveQuote}
        onRejectQuote={handleRejectQuote}
        getQuote={getQuote}
      />

      <ComposeBar
        onSend={handleSend}
        onAttach={handleAttach}
        placeholder={`Message ${project.rep_name}...`}
      />
    </div>
  )
}
