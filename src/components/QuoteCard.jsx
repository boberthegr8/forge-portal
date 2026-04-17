import { fmt$ } from '../utils.js'
import styles from './QuoteCard.module.css'

export default function QuoteCard({ quote, onApprove, onReject, isClient = false }) {
  if (!quote) return null

  const statusLabel = {
    pending: 'Awaiting approval',
    approved: 'Approved',
    rejected: 'Declined',
  }[quote.status]

  const statusClass = {
    pending: styles.pending,
    approved: styles.approved,
    rejected: styles.rejected,
  }[quote.status]

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Quote</div>
          <div className={styles.headerNum}>#{quote.number}</div>
        </div>
        <span className={`${styles.statusBadge} ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className={styles.body}>
        {quote.lineItems.map((li, i) => (
          <div key={i} className={styles.lineItem}>
            <span className={styles.lineLabel}>{li.label}</span>
            <span className={styles.lineAmount}>{fmt$(li.amount)}</span>
          </div>
        ))}
        <div className={styles.divider} />
        <div className={styles.total}>
          <span>Total</span>
          <span>{fmt$(quote.total)}</span>
        </div>
        {quote.notes && (
          <div className={styles.notes}>{quote.notes}</div>
        )}
      </div>

      {quote.status === 'pending' && (isClient ? (
        <div className={styles.actions}>
          <button className={styles.btnReject} onClick={() => onReject?.(quote.id)}>
            Decline
          </button>
          <button className={styles.btnApprove} onClick={() => onApprove?.(quote.id)}>
            Approve quote
          </button>
        </div>
      ) : (
        <div className={styles.repActions}>
          <span className={styles.awaitingText}>Awaiting client approval</span>
        </div>
      ))}

      {quote.status === 'approved' && (
        <div className={styles.approvedBanner}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" fill="#1D9E75"/>
            <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Approved{quote.approvedAt ? ` · ${new Date(quote.approvedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}` : ''}
        </div>
      )}
    </div>
  )
}
