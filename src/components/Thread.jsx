import { useEffect, useRef } from 'react'
import { msgTime, msgDateLabel } from '../utils.js'
import QuoteCard from './QuoteCard.jsx'
import FileBubble from './FileBubble.jsx'
import styles from './Thread.module.css'

// Group consecutive messages by date
function groupByDate(messages) {
  const groups = []
  let lastDate = null
  messages.forEach(msg => {
    const dateLabel = msgDateLabel(msg.ts)
    if (dateLabel !== lastDate) {
      groups.push({ dateLabel, messages: [msg] })
      lastDate = dateLabel
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })
  return groups
}

export default function Thread({
  messages,
  perspective,      // 'rep' | 'client' — which side is "me" (right-aligned)
  onApproveQuote,
  onRejectQuote,
  getQuote,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const groups = groupByDate(messages)

  return (
    <div className={styles.thread}>
      {groups.map((group, gi) => (
        <div key={gi}>
          <div className={styles.dateChip}>
            <span>{group.dateLabel}</span>
          </div>

          {group.messages.map(msg => {
            const isMe = msg.sender === perspective
            return (
              <div
                key={msg.id}
                className={`${styles.row} ${isMe ? styles.me : styles.them}`}
              >
                {msg.type === 'text' && (
                  <div className={styles.bubbleWrap}>
                    <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                      {msg.text}
                    </div>
                    <div className={`${styles.time} ${isMe ? styles.timeRight : ''}`}>
                      {msgTime(msg.ts)}
                      {isMe && (
                        <span className={styles.readTick} title={msg.read ? 'Read' : 'Delivered'}>
                          {msg.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {msg.type === 'file' && (
                  <div className={styles.bubbleWrap}>
                    <FileBubble
                      fileName={msg.fileName}
                      fileSize={msg.fileSize}
                      fileType={msg.fileType}
                    />
                    <div className={`${styles.time} ${isMe ? styles.timeRight : ''}`}>
                      {msgTime(msg.ts)}
                    </div>
                  </div>
                )}

                {msg.type === 'photo' && (
                  <div className={styles.bubbleWrap}>
                    <div className={styles.photoPlaceholder}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span>{msg.fileName}</span>
                    </div>
                    <div className={`${styles.time} ${isMe ? styles.timeRight : ''}`}>
                      {msgTime(msg.ts)}
                    </div>
                  </div>
                )}

                {msg.type === 'quote' && (() => {
                  const quote = getQuote(msg.quoteId)
                  return (
                    <div className={styles.bubbleWrap}>
                      <QuoteCard
                        quote={quote}
                        isClient={perspective === 'client'}
                        onApprove={onApproveQuote}
                        onReject={onRejectQuote}
                      />
                      <div className={`${styles.time} ${isMe ? styles.timeRight : ''}`}>
                        {msgTime(msg.ts)}
                      </div>
                    </div>
                  )
                })()}

                {msg.type === 'status_update' && (
                  <div className={styles.statusUpdate}>
                    <div className={styles.statusDot} />
                    <span>{msg.text}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
