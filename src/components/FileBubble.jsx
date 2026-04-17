import styles from './FileBubble.module.css'

const FILE_ICONS = {
  pdf: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 1h6l3 3v9H3V1z"/>
      <path d="M9 1v3h3"/>
      <line x1="5" y1="6" x2="9" y2="6"/>
      <line x1="5" y1="8.5" x2="9" y2="8.5"/>
    </svg>
  ),
  image: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="12" height="12" rx="2"/>
      <circle cx="4.5" cy="4.5" r="1"/>
      <path d="M1 9l3-3 2 2 2-2 4 4"/>
    </svg>
  ),
  default: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#5f5e5a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 1h6l3 3v9H3V1z"/>
      <path d="M9 1v3h3"/>
    </svg>
  ),
}

const ICON_BG = {
  pdf: '#E6F1FB',
  image: '#EEEDFE',
  default: '#f2f1ed',
}

export default function FileBubble({ fileName, fileSize, fileType }) {
  const iconKey = fileType === 'pdf' ? 'pdf' : fileType === 'image' ? 'image' : 'default'
  return (
    <div className={styles.bubble}>
      <div className={styles.icon} style={{ background: ICON_BG[iconKey] }}>
        {FILE_ICONS[iconKey]}
      </div>
      <div className={styles.meta}>
        <div className={styles.name}>{fileName}</div>
        <div className={styles.size}>{fileSize}</div>
      </div>
    </div>
  )
}
