import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      background: 'var(--bg)', padding: 24, textAlign: 'center'
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: 'var(--forge)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M16 4L28 10V16C28 23 22 28.5 16 30C10 28.5 4 23 4 16V10L16 4Z" fill="white"/>
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
        Portal not found
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 280, lineHeight: 1.5 }}>
        This link may have expired or been deactivated. Contact your rep for a new link.
      </div>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 8, padding: '9px 20px', borderRadius: 10,
          background: 'var(--forge)', color: '#fff', fontSize: 13,
          fontWeight: 500, border: 'none', cursor: 'pointer'
        }}
      >
        Go to rep dashboard
      </button>
    </div>
  )
}
