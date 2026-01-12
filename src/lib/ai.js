// Kimi K2 AI Service for intelligent search

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || ''
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'kimi-k2-0905:free'

export function isAIConfigured() {
    return AI_API_KEY && AI_API_KEY.length > 10
}

// AI-powered search that understands context
export async function aiSearch(query, guides) {
    if (!isAIConfigured() || !guides || guides.length === 0) {
        console.log('AI not configured or no guides, falling back to basic search')
        return basicSearch(query, guides)
    }

    try {
        // Create a summary of guides for AI context
        const guideSummaries = guides.map((g, idx) => ({
            index: idx,
            id: g.id,
            title: g.title,
            slug: g.slug,
            keywords: g.keywords || [],
            preview: (g.content || g.markdown || g.html_content || '').slice(0, 200)
        }))

        const prompt = `أنت محرك بحث ذكي. لديك قائمة من الأدلة (guides) التالية:

${JSON.stringify(guideSummaries, null, 2)}

المستخدم يبحث عن: "${query}"

مهمتك:
1. حلل استعلام البحث (بالعربية أو الإنجليزية)
2. ابحث عن الأدلة الأكثر صلة بالاستعلام
3. أرجع قائمة بأرقام الفهرس (indices) للأدلة المطابقة مرتبة من الأكثر صلة للأقل

أرجع فقط JSON array بصيغة: [0, 2, 5] (أرقام الفهرس)
إذا لم تجد نتائج مطابقة، أرجع: []
لا تضف أي نص آخر، فقط JSON array.`

        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        })

        if (!response.ok) {
            console.error('AI API error:', response.status)
            return basicSearch(query, guides)
        }

        const data = await response.json()
        const aiResponse = data.choices?.[0]?.message?.content?.trim() || '[]'

        console.log('AI Response:', aiResponse)

        // Parse AI response
        let indices = []
        try {
            // Extract JSON array from response
            const match = aiResponse.match(/\[[\d,\s]*\]/)
            if (match) {
                indices = JSON.parse(match[0])
            }
        } catch (e) {
            console.error('Failed to parse AI response:', e)
            return basicSearch(query, guides)
        }

        // Map indices to actual guides
        const results = indices
            .filter(idx => idx >= 0 && idx < guides.length)
            .map(idx => ({ ...guides[idx], aiScore: indices.length - indices.indexOf(idx) }))

        if (results.length > 0) {
            return results
        }

        // Fallback to basic search if AI found nothing
        return basicSearch(query, guides)

    } catch (error) {
        console.error('AI search error:', error)
        return basicSearch(query, guides)
    }
}

// Basic search fallback with Arabic support
export function basicSearch(query, guides) {
    if (!guides || guides.length === 0) return []
    if (!query || !query.trim()) return guides

    const q = query.toLowerCase().trim()
    const words = q.split(/\s+/).filter(w => w.length > 1)

    const scored = guides.map(guide => {
        let score = 0
        const title = (guide.title || '').toLowerCase()
        const content = (guide.content || guide.markdown || guide.html_content || '').toLowerCase()
        const keywords = Array.isArray(guide.keywords)
            ? guide.keywords.map(k => (k || '').toLowerCase())
            : []

        // Full query match
        if (title === q) score += 100
        else if (title.includes(q)) score += 50
        else if (title.startsWith(q)) score += 40

        // Keywords
        keywords.forEach(kw => {
            if (kw === q) score += 30
            else if (kw.includes(q) || q.includes(kw)) score += 15
        })

        // Content
        if (content.includes(q)) score += 20

        // Word by word matching (important for Arabic)
        words.forEach(word => {
            if (title.includes(word)) score += 15
            if (content.includes(word)) score += 5
            keywords.forEach(kw => {
                if (kw.includes(word) || word.includes(kw)) score += 10
            })
        })

        // Character matching for Arabic (when words don't match exactly)
        if (score === 0 && q.length >= 2) {
            for (let i = 0; i < q.length - 1; i++) {
                const chars = q.slice(i, i + 2)
                if (title.includes(chars)) score += 2
                if (content.includes(chars)) score += 1
            }
        }

        return { ...guide, score }
    })

    return scored
        .filter(g => g.score > 0)
        .sort((a, b) => b.score - a.score)
}

// Quick AI answer for queries
export async function getAIAnswer(query, guides) {
    if (!isAIConfigured()) return null

    try {
        const guidesContext = guides.slice(0, 10).map(g =>
            `العنوان: ${g.title}\nالكلمات المفتاحية: ${(g.keywords || []).join(', ')}\nالمحتوى: ${(g.content || g.markdown || '').slice(0, 500)}`
        ).join('\n\n---\n\n')

        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'أنت مساعد ذكي. أجب بإيجاز شديد (جملة أو جملتين فقط) بناءً على المحتوى المتاح.'
                    },
                    {
                        role: 'user',
                        content: `المحتوى المتاح:\n${guidesContext}\n\nسؤال المستخدم: ${query}\n\nأجب بإيجاز:`
                    }
                ],
                temperature: 0.5,
                max_tokens: 150
            })
        })

        if (!response.ok) return null

        const data = await response.json()
        return data.choices?.[0]?.message?.content?.trim() || null
    } catch (error) {
        console.error('AI answer error:', error)
        return null
    }
}
