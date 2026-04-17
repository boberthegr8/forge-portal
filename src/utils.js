import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

export const fmt$ = (n) =>
  '$' + Number(n || 0).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const initials = (name = '') =>
  name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2)

const AVATAR_COLORS = [
  '#1D9E75', '#185FA5', '#534AB7', '#993556',
  '#854F0B', '#A32D2D', '#3B6D11', '#0F6E56',
]
export const avatarColor = (name = '') => {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export const timeAgo = (ts) =>
  formatDistanceToNow(new Date(ts), { addSuffix: true })

export const msgTime = (ts) =>
  format(new Date(ts), 'h:mm a')

export const msgDateLabel = (ts) => {
  const d = new Date(ts)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d, yyyy')
}

export const portalUrl = (token) =>
  `${window.location.origin}/portal/${token}`

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
