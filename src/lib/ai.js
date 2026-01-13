// Kimi K2 AI Agent - Intelligent Search Engine
// Advanced AI-powered search with deep understanding

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.routeway.ai/v1/chat/completions'
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || ''
const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'kimi-k2-0905:free'

export function isAIConfigured() {
    return AI_API_KEY && AI_API_KEY.length > 10
}

// Smart keyword extraction from query
function extractKeywords(query) {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
        'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'between',
        'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
        'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
        'how', 'what', 'when', 'where', 'which', 'who', 'whom', 'why',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'عن', 'في', 'من', 'إلى', 'على', 'مع', 'هل', 'ما', 'كيف', 'أين', 'متى', 'لماذا',
        'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي', 'و', 'أو', 'لكن', 'ثم', 'أن', 'إن',
        'كان', 'يكون', 'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'لا', 'نعم', 'كل', 'بعض'
    ])
    
    return query
        .toLowerCase()
        .split(/[\s,،.؟?!]+/)
        .filter(word => word.length > 1 && !stopWords.has(word))
}

// Fuzzy matching for typos
function fuzzyMatch(str1, str2) {
    if (!str1 || !str2) return 0
    str1 = str1.toLowerCase()
    str2 = str2.toLowerCase()
    
    if (str1 === str2) return 1
    if (str1.includes(str2) || str2.includes(str1)) return 0.9
    
    const len1 = str1.length
    const len2 = str2.length
    const maxLen = Math.max(len1, len2)
    
    if (maxLen === 0) return 1
    
    let matches = 0
    const chars1 = new Set(str1.split(''))
    for (const char of str2) {
        if (chars1.has(char)) matches++
    }
    
    return matches / maxLen
}

// Enhanced basic search with multiple algorithms
export function basicSearch(query, guides) {
    if (!guides || guides.length === 0) return []
    if (!query || !query.trim()) return guides

    const q = query.toLowerCase().trim()
    const keywords = extractKeywords(query)
    
    const scored = guides.map(guide => {
        let score = 0
        const title = (guide.title || '').toLowerCase()
        const content = (guide.content || guide.markdown || guide.html_content || '').toLowerCase()
        const keywordsArr = Array.isArray(guide.keywords)
            ? guide.keywords.map(k => (k || '').toLowerCase())
            : []

        // 1. Exact title match (highest priority)
        if (title === q) score += 200
        else if (title.includes(q)) score += 100
        else if (title.startsWith(q)) score += 80

        // 2. Keyword exact match
        keywordsArr.forEach(kw => {
            if (kw === q) score += 80
            else if (kw.includes(q) || q.includes(kw)) score += 40
        })

        // 3. Content contains full query
        if (content.includes(q)) score += 50

        // 4. Individual keyword matching
        keywords.forEach(keyword => {
            if (title.includes(keyword)) score += 30
            if (title.startsWith(keyword)) score += 20
            
            keywordsArr.forEach(kw => {
                if (kw === keyword) score += 25
                else if (kw.includes(keyword) || keyword.includes(kw)) score += 15
            })
            
            try {
                const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
                const contentMatches = (content.match(regex) || []).length
                score += Math.min(contentMatches * 3, 30)
            } catch (e) {
                if (content.includes(keyword)) score += 10
            }
        })

        // 5. Fuzzy matching for typos
        keywords.forEach(keyword => {
            const titleSim = fuzzyMatch(keyword, title)
            if (titleSim > 0.7) score += Math.floor(titleSim * 20)
            
            keywordsArr.forEach(kw => {
                const kwSim = fuzzyMatch(keyword, kw)
                if (kwSim > 0.7) score += Math.floor(kwSim * 15)
            })
        })

        // 6. Arabic character matching
        if (score < 10 && q.length >= 2) {
            for (let i = 0; i < q.length - 1; i++) {
                const chars = q.slice(i, i + 2)
                if (title.includes(chars)) score += 3
                if (content.includes(chars)) score += 1
            }
        }

        return { ...guide, score }
    })

    return scored
        .filter(g => g.score > 0)
        .sort((a, b) => b.score - a.score)
}

// AI Agent deep search - understands intent and context
export async function aiAgentSearch(query, guides) {
    if (!isAIConfigured()) {
        console.log('AI not configured')
        return { results: [], aiInsight: null, relatedTopics: [], suggestions: [] }
    }

    if (!guides || guides.length === 0) {
        return { 
            results: [], 
            aiInsight: 'لا توجد أدلة في قاعدة البيانات. أضف بعض الأدلة أولاً!', 
            relatedTopics: [],
            suggestions: ['أضف دليل جديد باستخدام زر "Add Guide"']
        }
    }

    try {
        const guidesContext = guides.map((g, idx) => ({
            idx,
            title: g.title,
            keywords: g.keywords || [],
            preview: (g.content || g.markdown || g.html_content || '').slice(0, 400)
        }))

        const prompt = `أنت وكيل بحث ذكي (AI Search Agent) متخصص ومحترف. مهمتك فهم نية المستخدم والعثور على أفضل النتائج.

📚 الأدلة المتاحة:
${JSON.stringify(guidesContext, null, 2)}

🔍 استعلام المستخدم: "${query}"

📋 مهمتك:
1. افهم نية المستخدم الحقيقية - ماذا يريد أن يتعلم؟
2. ابحث عن كل الأدلة ذات الصلة (مباشرة وغير مباشرة)
3. فكر بطريقة إبداعية - ربما يبحث عن شيء مرتبط
4. قدم إجابة مفيدة وعملية

أجب بـ JSON فقط بهذا الشكل:
{
    "indices": [0, 2, 5],
    "insight": "إجابة مختصرة ومفيدة توضح ما وجدته",
    "relatedTopics": ["موضوع 1", "موضوع 2"],
    "suggestions": ["اقتراح بحث 1", "اقتراح 2"],
    "reasoning": "سبب اختيارك لهذه النتائج"
}

⚠️ إذا لم تجد نتائج مطابقة، اقترح بدائل:
{
    "indices": [],
    "insight": "لم أجد نتائج مطابقة، لكن يمكنك...",
    "relatedTopics": [],
    "suggestions": ["جرب البحث عن...", "أو أضف دليل جديد عن..."],
    "reasoning": "السبب"
}`

        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                max_tokens: 1000
            })
        })

        if (!response.ok) {
            console.error('AI API error:', response.status)
            return { results: [], aiInsight: null, relatedTopics: [], suggestions: [] }
        }

        const data = await response.json()
        const aiResponse = data.choices?.[0]?.message?.content?.trim() || '{}'

        console.log('🤖 AI Agent Response:', aiResponse)

        let parsed = { indices: [], insight: null, relatedTopics: [], suggestions: [], reasoning: '' }
        try {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0])
            }
        } catch (e) {
            console.error('Failed to parse AI response:', e)
        }

        const aiResults = (parsed.indices || [])
            .filter(idx => idx >= 0 && idx < guides.length)
            .map((idx, i) => ({ ...guides[idx], aiRank: i + 1, isAIResult: true }))

        return {
            results: aiResults,
            aiInsight: parsed.insight || null,
            relatedTopics: parsed.relatedTopics || [],
            suggestions: parsed.suggestions || [],
            reasoning: parsed.reasoning || ''
        }

    } catch (error) {
        console.error('AI Agent error:', error)
        return { results: [], aiInsight: null, relatedTopics: [], suggestions: [] }
    }
}

// Get AI enhancement for empty results
export async function getAIEnhancement(query, guides) {
    if (!isAIConfigured()) {
        return null
    }
    
    return await aiAgentSearch(query, guides)
}
