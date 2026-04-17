import { useState, useRef } from 'react'
import styles from './ComposeBar.module.css'

export default function ComposeBar({ onSend, onAttach, onSendQuote, showQuoteBtn = false, placeholder = 'Message...' }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setText(e.target.value)
    // Auto-grow textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <div className={styles.bar}>
      {/* Quick action pills */}
      <div className={styles.pills}>
        <button className={styles.pill} onClick={() => onAttach?.('photo')} title="Send photo">
          <CameraIcon /> Photo
        </button>
        <button className={styles.pill} onClick={() => onAttach?.('file')} title="Send file">
          <FileIcon /> File
        </button>
        {showQuoteBtn && (
          <button className={`${styles.pill} ${styles.pillAccent}`} onClick={onSendQuote} title="Send quote">
            <QuoteIcon /> Send quote
          </button>
        )}
      </div>

      {/* Input row */}
      <div className={styles.inputRow}>
        <button className={styles.attachBtn} onClick={() => onAttach?.('file')} title="Attach">
          <AttachIcon />
        </button>
        <textarea
          ref={textareaRef}
          className={styles.input}
          placeholder={placeholder}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          className={`${styles.sendBtn} ${text.trim() ? styles.sendActive : ''}`}
          onClick={handleSend}
          disabled={!text.trim()}
          title="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

// ── ICONS ────────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="12" height="9" rx="1.5"/>
    <circle cx="7" cy="7.5" r="2.5"/>
    <path d="M5 3l1-2h2l1 2"/>
  </svg>
)

const FileIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 1h6l3 3v9H3V1z"/>
    <path d="M9 1v3h3"/>
  </svg>
)

const QuoteIcon = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="12" height="9" rx="1.5"/>
    <line x1="1" y1="5" x2="13" y2="5"/>
    <line x1="4" y1="1" x2="4" y2="3"/>
    <line x1="10" y1="1" x2="10" y2="3"/>
  </svg>
)

const AttachIcon = () => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 6.5L6.5 12A3.5 3.5 0 012 7.5l5.5-5.5A2 2 0 0110.5 5L5 10.5A1 1 0 013.5 9L9 3.5"/>
  </svg>
)

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 7H2M8 3l4 4-4 4"/>
  </svg>
)
