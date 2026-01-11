import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client only if credentials are valid
export const supabase = (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project'))
    ? createClient(supabaseUrl, supabaseKey)
    : null

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return supabase !== null
}

// Mock AI search function (to be replaced with real AI later)
export const aiSearch = async (query, items) => {
    // Simple semantic search simulation
    const lowerQuery = query.toLowerCase()
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 1)

    return items.filter(item => {
        const content = `${item.title || ''} ${item.content || ''} ${item.tags?.join(' ') || ''}`.toLowerCase()
        
        // Check if any word matches
        return queryWords.some(word => content.includes(word))
    }).sort((a, b) => {
        // Sort by relevance (number of matching words)
        const aMatches = queryWords.filter(word => 
            `${a.title || ''} ${a.content || ''}`.toLowerCase().includes(word)
        ).length
        const bMatches = queryWords.filter(word => 
            `${b.title || ''} ${b.content || ''}`.toLowerCase().includes(word)
        ).length
        return bMatches - aMatches
    })
}
