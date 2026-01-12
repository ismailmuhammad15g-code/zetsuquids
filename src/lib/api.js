import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function isSupabaseConfigured() {
  return supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co')
}

// Generate unique slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
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

  async getBySlug(slug) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      return guides.find(g => g.slug === slug) || null
    }
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) return null
    return data
  },

  async getById(id) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      return guides.find(g => g.id == id) || null
    }
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  },

  async create(guide) {
    const slug = generateSlug(guide.title)
    const guideData = {
      title: guide.title,
      slug,
      content: guide.content || '',
      markdown: guide.markdown || '',
      html_content: guide.html_content || '',
      css_content: guide.css_content || '',
      keywords: guide.keywords || [],
      content_type: guide.content_type || 'markdown',
      created_at: new Date().toISOString()
    }

    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      const newGuide = { ...guideData, id: Date.now() }
      guides.unshift(newGuide)
      localStorage.setItem('guides', JSON.stringify(guides))
      return newGuide
    }

    const { data, error } = await supabase
      .from('guides')
      .insert([guideData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      const idx = guides.findIndex(g => g.id == id)
      if (idx !== -1) {
        guides[idx] = { ...guides[idx], ...updates, updated_at: new Date().toISOString() }
        localStorage.setItem('guides', JSON.stringify(guides))
        return guides[idx]
      }
      return null
    }
    const { data, error } = await supabase
      .from('guides')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    if (!isSupabaseConfigured()) {
      const guides = JSON.parse(localStorage.getItem('guides') || '[]')
      const filtered = guides.filter(g => g.id != id)
      localStorage.setItem('guides', JSON.stringify(filtered))
      return true
    }
    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  },

  // AI Search within guides
  async search(query) {
    const allGuides = await this.getAll()
    if (!query.trim()) return allGuides

    const q = query.toLowerCase()
    
    // Score-based search
    const scored = allGuides.map(guide => {
      let score = 0
      const title = (guide.title || '').toLowerCase()
      const content = (guide.content || guide.markdown || '').toLowerCase()
      const keywords = (guide.keywords || []).map(k => k.toLowerCase())
      
      // Title exact match
      if (title === q) score += 100
      // Title contains query
      else if (title.includes(q)) score += 50
      // Title starts with query
      else if (title.startsWith(q)) score += 40
      
      // Keywords match
      keywords.forEach(kw => {
        if (kw === q) score += 30
        else if (kw.includes(q)) score += 15
      })
      
      // Content contains query
      const contentMatches = (content.match(new RegExp(q, 'gi')) || []).length
      score += contentMatches * 5
      
      return { ...guide, score }
    })
    
    return scored
      .filter(g => g.score > 0)
      .sort((a, b) => b.score - a.score)
  }
}

// Prompts API (keeping for backward compatibility)
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
      .insert([prompt])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const prompts = JSON.parse(localStorage.getItem('prompts') || '[]')
      const idx = prompts.findIndex(p => p.id == id)
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
      const filtered = prompts.filter(p => p.id != id)
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
