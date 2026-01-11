import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function isSupabaseConfigured() {
  return supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co')
}

// Prompts API
export const promptsApi = {
  async getAll() {
    if (!isSupabaseConfigured()) {
      return JSON.parse(localStorage.getItem('prompts') || '[]')
    }
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(prompt) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem('prompts') || '[]')
      const newPrompt = { ...prompt, id: Date.now(), created_at: new Date().toISOString() }
      prompts.unshift(newPrompt)
      localStorage.setItem('prompts', JSON.stringify(prompts))
      return newPrompt
    }
    const { data, error } = await supabase
      .from('prompts')
      .insert([{ title: prompt.title, content: prompt.content, tags: prompt.tags || [] }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem('prompts') || '[]')
      const idx = prompts.findIndex(p => p.id === id)
      if (idx !== -1) {
        prompts[idx] = { ...prompts[idx], ...updates }
        localStorage.setItem('prompts', JSON.stringify(prompts))
        return prompts[idx]
      }
      return null
    }
    const { data, error } = await supabase
      .from('prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem('prompts') || '[]')
      const filtered = prompts.filter(p => p.id !== id)
      localStorage.setItem('prompts', JSON.stringify(filtered))
      return true
    }
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}

// Guides API
export const guidesApi = {
  async getAll() {
    if (!isSupabaseConfigured()) {
      return JSON.parse(localStorage.getItem('guides') || '[]')
    }
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(guide) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      const newGuide = { ...guide, id: Date.now(), created_at: new Date().toISOString() }
      guides.unshift(newGuide)
      localStorage.setItem('guides', JSON.stringify(guides))
      return newGuide
    }
    const { data, error } = await supabase
      .from('guides')
      .insert([{
        title: guide.title,
        filename: guide.filename,
        content: guide.content,
        keywords: guide.keywords || []
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      const filtered = guides.filter(g => g.id !== id)
      localStorage.setItem('guides', JSON.stringify(filtered))
      return true
    }
    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  }
}
