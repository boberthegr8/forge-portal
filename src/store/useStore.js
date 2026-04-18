import { create } from 'zustand'
import { supabase } from '../supabase.js'

export const generateToken = () =>
  Math.random().toString(36).slice(2, 10) +
  Math.random().toString(36).slice(2, 10)

export const useStore = create((set, get) => ({
  projects: [],
  messages: [],
  quotes: [],

  fetchProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error(error); return }
    set({ projects: data })
  },

  getProjectByToken: (token) =>
    get().projects.find(p => p.token === token),

  getProjectById: (id) =>
    get().projects.find(p => p.id === id),

  createProject: async ({ clientName, clientEmail, projectName, projectDesc, repName, repCompany, openingMessage }) => {
    const token = generateToken()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        token,
        client_name: clientName,
        client_email: clientEmail,
        project_name: projectName,
        project_desc: projectDesc,
        rep_name: repName,
        rep_company: repCompany,
      })
      .select()
      .single()
    if (error) { console.error(error); return null }
    set(s => ({ projects: [data, ...s.projects] }))
    const firstName = clientName.split(' ')[0]
    const greeting = openingMessage ||
      `Hi ${firstName} — ${repName} here from ${repCompany}. I've set up your project portal for ${projectName}. You can send me plans, photos, or questions right here and I'll get back to you same day.`
    await get().sendMessage({ projectId: data.id, sender: 'rep', type: 'text', text: greeting })
    return data
  },

  togglePortal: async (projectId) => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) return
    const newVal = !project.portal_enabled
    await supabase.from('projects').update({ portal_enabled: newVal }).eq('id', projectId)
    set(s => ({
      projects: s.projects.map(p => p.id === projectId ? { ...p, portal_enabled: newVal } : p)
    }))
  },

  fetchMessages: async (projectId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) { console.error(error); return }
    set(s => ({
      messages: [...s.messages.filter(m => m.project_id !== projectId), ...data]
    }))
  },

  getMessages: (projectId) =>
    get().messages.filter(m => m.project_id === projectId),

  sendMessage: async ({ projectId, sender, type, text, fileName, fileSize, fileType, quoteId }) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender,
        type,
        text: text || null,
        file_name: fileName || null,
        file_size: fileSize || null,
        file_type: fileType || null,
        quote_id: quoteId || null,
        read: sender === 'rep',
      })
      .select()
      .single()
    if (error) { console.error(error); return null }
    set(s => ({ messages: [...s.messages, data] }))
    return data
  },

  markMessagesRead: async (projectId, sender) => {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('project_id', projectId)
      .eq('sender', sender)
      .eq('read', false)
    set(s => ({
      messages: s.messages.map(m =>
        m.project_id === projectId && m.sender === sender ? { ...m, read: true } : m
      )
    }))
  },

  getUnreadCount: (projectId, sender) =>
    get().messages.filter(m => m.project_id === projectId && m.sender === sender && !m.read).length,

  subscribeToProject: (projectId) => {
    const channel = supabase
      .channel(`project-${projectId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        set(s => {
          const exists = s.messages.find(m => m.id === payload.new.id)
          if (exists) return s
          return { messages: [...s.messages, payload.new] }
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'quotes',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        set(s => ({
          quotes: s.quotes.map(q => q.id === payload.new.id ? payload.new : q)
        }))
      })
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })
    return () => supabase.removeChannel(channel)
  },

  fetchQuotes: async (projectId) => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('project_id', projectId)
    if (error) { console.error(error); return }
    set(s => ({
      quotes: [...s.quotes.filter(q => q.project_id !== projectId), ...data]
    }))
  },

  getQuote: (quoteId) =>
    get().quotes.find(q => q.id === quoteId),

  createQuote: async ({ projectId, number, lineItems, notes }) => {
    const total = lineItems.reduce((s, li) => s + li.amount, 0)
    const { data, error } = await supabase
      .from('quotes')
      .insert({ project_id: projectId, number, line_items: lineItems, total, notes: notes || '' })
      .select()
      .single()
    if (error) { console.error(error); return null }
    await supabase.from('projects').update({ active_quote_id: data.id }).eq('id', projectId)
    set(s => ({
      quotes: [...s.quotes, data],
      projects: s.projects.map(p => p.id === projectId ? { ...p, active_quote_id: data.id } : p)
    }))
    return data
  },

  approveQuote: async (quoteId) => {
    const now = new Date().toISOString()
    await supabase.from('quotes').update({ status: 'approved', approved_at: now }).eq('id', quoteId)
    set(s => ({
      quotes: s.quotes.map(q => q.id === quoteId ? { ...q, status: 'approved', approved_at: now } : q)
    }))
  },

  rejectQuote: async (quoteId) => {
    await supabase.from('quotes').update({ status: 'rejected' }).eq('id', quoteId)
    set(s => ({
      quotes: s.quotes.map(q => q.id === quoteId ? { ...q, status: 'rejected' } : q)
    }))
  },
}))
