import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── HELPERS ──────────────────────────────────────────────────
let _id = Date.now()
export const uid = () => ++_id

export const generateToken = () =>
  Math.random().toString(36).slice(2, 10) +
  Math.random().toString(36).slice(2, 10)

// ── MESSAGE TYPES ─────────────────────────────────────────────
// type: 'text' | 'file' | 'photo' | 'quote' | 'status_update'
// sender: 'rep' | 'client'

// ── INITIAL SEED DATA ─────────────────────────────────────────
const SEED_PROJECTS = [
  {
    id: 1,
    token: 'demo-token-abc123',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah@example.com',
    projectName: 'Johnson Residence',
    projectDesc: '1,840 sq ft bungalow — truss package',
    repName: 'Rob Flagg',
    repCompany: 'Forge Building Group',
    status: 'active', // active | complete | archived
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    portalEnabled: true,
    activeQuoteId: 1,
  },
]

const SEED_MESSAGES = [
  {
    id: 1,
    projectId: 1,
    sender: 'rep',
    type: 'text',
    text: "Hi Sarah — Rob here from Forge Building Group. I've set up your project portal. You can send me plans, photos, or questions right here and I'll get back to you same day.",
    ts: Date.now() - 1000 * 60 * 60 * 5,
    read: true,
  },
  {
    id: 2,
    projectId: 1,
    sender: 'client',
    type: 'text',
    text: "Thanks Rob! This is really convenient. I just uploaded the floor plan from our architect.",
    ts: Date.now() - 1000 * 60 * 60 * 4,
    read: true,
  },
  {
    id: 3,
    projectId: 1,
    sender: 'client',
    type: 'file',
    fileName: 'floorplan_v2.pdf',
    fileSize: '2.4 MB',
    fileType: 'pdf',
    ts: Date.now() - 1000 * 60 * 60 * 4,
    read: true,
  },
  {
    id: 4,
    projectId: 1,
    sender: 'rep',
    type: 'text',
    text: "Perfect — reviewed it. The layout works well for your truss span. I've put together the updated quote based on the revised floor plan.",
    ts: Date.now() - 1000 * 60 * 60 * 2,
    read: true,
  },
  {
    id: 5,
    projectId: 1,
    sender: 'rep',
    type: 'quote',
    quoteId: 1,
    ts: Date.now() - 1000 * 60 * 60 * 2,
    read: true,
  },
]

const SEED_QUOTES = [
  {
    id: 1,
    projectId: 1,
    number: 'Q-2024-041',
    lineItems: [
      { label: 'Truss package', amount: 18400 },
      { label: 'Delivery & install', amount: 3200 },
      { label: 'Engineering stamps', amount: 850 },
    ],
    total: 22450,
    status: 'pending', // pending | approved | rejected
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    approvedAt: null,
    notes: '30-day payment terms. Subject to material pricing at time of order.',
  },
]

// ── STORE ─────────────────────────────────────────────────────
export const useStore = create(
  persist(
    (set, get) => ({
      // ── STATE ──
      projects: SEED_PROJECTS,
      messages: SEED_MESSAGES,
      quotes: SEED_QUOTES,

      // ── PROJECT ACTIONS ──
      createProject: ({ clientName, clientEmail, projectName, projectDesc, repName, repCompany }) => {
        const project = {
          id: uid(),
          token: generateToken(),
          clientName,
          clientEmail,
          projectName,
          projectDesc,
          repName,
          repCompany,
          status: 'active',
          createdAt: Date.now(),
          portalEnabled: true,
          activeQuoteId: null,
        }
        set(s => ({ projects: [project, ...s.projects] }))
        return project
      },

      getProjectByToken: (token) =>
        get().projects.find(p => p.token === token),

      getProjectById: (id) =>
        get().projects.find(p => p.id === Number(id)),

      togglePortal: (projectId) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId ? { ...p, portalEnabled: !p.portalEnabled } : p
          )
        })),

      updateProjectStatus: (projectId, status) =>
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId ? { ...p, status } : p
          )
        })),

      // ── MESSAGE ACTIONS ──
      getMessages: (projectId) =>
        get().messages.filter(m => m.projectId === projectId),

      sendMessage: ({ projectId, sender, type, text, fileName, fileSize, fileType, quoteId }) => {
        const msg = {
          id: uid(),
          projectId,
          sender,
          type,
          text: text || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          fileType: fileType || null,
          quoteId: quoteId || null,
          ts: Date.now(),
          read: sender === 'rep', // rep messages start as read; client messages start unread
        }
        set(s => ({ messages: [...s.messages, msg] }))
        return msg
      },

      markMessagesRead: (projectId, sender) =>
        set(s => ({
          messages: s.messages.map(m =>
            m.projectId === projectId && m.sender === sender
              ? { ...m, read: true }
              : m
          )
        })),

      getUnreadCount: (projectId, sender) =>
        get().messages.filter(
          m => m.projectId === projectId && m.sender === sender && !m.read
        ).length,

      // ── QUOTE ACTIONS ──
      getQuote: (quoteId) =>
        get().quotes.find(q => q.id === quoteId),

      createQuote: ({ projectId, number, lineItems, notes }) => {
        const total = lineItems.reduce((sum, li) => sum + li.amount, 0)
        const quote = {
          id: uid(),
          projectId,
          number,
          lineItems,
          total,
          status: 'pending',
          createdAt: Date.now(),
          approvedAt: null,
          notes: notes || '',
        }
        set(s => ({
          quotes: [...s.quotes, quote],
          projects: s.projects.map(p =>
            p.id === projectId ? { ...p, activeQuoteId: quote.id } : p
          ),
        }))
        return quote
      },

      approveQuote: (quoteId) =>
        set(s => ({
          quotes: s.quotes.map(q =>
            q.id === quoteId
              ? { ...q, status: 'approved', approvedAt: Date.now() }
              : q
          )
        })),

      rejectQuote: (quoteId) =>
        set(s => ({
          quotes: s.quotes.map(q =>
            q.id === quoteId ? { ...q, status: 'rejected' } : q
          )
        })),
    }),
    {
      name: 'forge-portal-store',
    }
  )
)
