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
