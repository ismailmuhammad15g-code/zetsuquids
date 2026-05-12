// Kimi K2 AI Agent - Intelligent Search Engine
// Advanced AI-powered search with deep understanding
// Uses Vercel serverless function /api/ai to avoid CORS issues

export function isAIConfigured(): boolean {
    return true
}

// Smart keyword extraction from query
function extractKeywords(query: string): string[] {
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

// Enhanced basic search with multiple algorithms
export function basicSearch(query: string, guides: unknown[]): unknown[] {
    if (!guides || guides.length === 0) return []
    if (!query || !query.trim()) return guides

    const q = query.toLowerCase().trim()
    const keywords = extractKeywords(query)

    // If no meaningful keywords, return empty
    if (keywords.length === 0 && q.length < 2) return []

    interface GuideItem {
        title?: string;
        content?: string;
        markdown?: string;
        html_content?: string;
        keywords?: string[];
    }

    interface ScoredGuide extends GuideItem {
        score: number;
        [key: string]: unknown;
    }

    const scored: ScoredGuide[] = (guides as GuideItem[]).map((guide) => {
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

        // 4. Individual keyword matching (only for meaningful keywords)
        keywords.forEach(keyword => {
            if (keyword.length >= 2) {
                if (title.includes(keyword)) score += 30
                if (title.startsWith(keyword)) score += 20

                keywordsArr.forEach(kw => {
                    if (kw === keyword) score += 25
                    else if (kw.includes(keyword) || keyword.includes(kw)) score += 15
                })
            }
        })

        return { ...guide, score }
    })

    return scored.filter((g) => g.score > 0).sort((a, b) => b.score - a.score)
}

export async function streamAIResponse(
    query: string,
    guides: unknown[],
    userEmail: string,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: string) => void
): Promise<{ needsSupport: boolean; supportCategory?: string; results?: unknown[] }> {
    // Basic search for context
    const relevantGuides = basicSearch(query, guides);
    const supportKeywords = ['help', 'error', 'problem', 'not working', 'bug', 'issue', 'crash', 'failed'];
    const queryLower = query.toLowerCase();
    const needsSupport = supportKeywords.some(keyword => queryLower.includes(keyword));

    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: query }],
                model: 'gemini-1.5-flash',
                userEmail,
                isDeepReasoning: true,
                isSubAgentMode: false,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            onError(`AI error: ${err}`);
            return { needsSupport, results: relevantGuides };
        }

        const contentType = response.headers.get('content-type') || '';

        // SSE streaming path
        if (contentType.includes('text/event-stream') && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') { onDone(); return { needsSupport, results: relevantGuides }; }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) onToken(parsed.content);
                        } catch { /* ignore parse errors */ }
                    }
                }
            }
            onDone();
            return { needsSupport, results: relevantGuides };
        }

        // Fallback: non-streaming JSON response
        const data = await response.json();
        const content: string = data.content ?? '';
        // Simulate streaming by firing tokens word-by-word
        const words = content.split(/(\s+)/);
        for (const word of words) {
            onToken(word);
            await new Promise(r => setTimeout(r, 18));
        }
        onDone();
        return { needsSupport, results: relevantGuides };

    } catch (error) {
        console.error('Error in stream AI response:', error);
        onError('Connection error. Please try again.');
        return { needsSupport: false };
    }
}

export async function aiAgentSearch(
    query: string,
    guides: unknown[],
    userEmail: string
): Promise<{ needsSupport: boolean; supportCategory?: string; aiInsight?: string; results?: unknown[] }> {
    try {
        const relevantGuides = basicSearch(query, guides);
        const supportKeywords = ['help', 'error', 'problem', 'not working', 'bug', 'issue', 'crash', 'failed'];
        const queryLower = query.toLowerCase();
        const needsSupport = supportKeywords.some(keyword => queryLower.includes(keyword));

        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: query }],
                model: 'gemini-1.5-flash',
                userEmail,
                isDeepReasoning: true,
                isSubAgentMode: false,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            return { needsSupport, supportCategory: needsSupport ? 'technical_issue' : undefined, aiInsight: data.content, results: relevantGuides };
        } else {
            console.error('AI API returned error:', await response.text());
        }
        return { needsSupport, supportCategory: needsSupport ? 'technical_issue' : undefined, results: relevantGuides };
    } catch (error) {
        console.error('Error in AI agent search:', error);
        return { needsSupport: false };
    }
}

// Get AI-enhanced search results with insights
export async function getAIEnhancement(
    query: string,
    guides: unknown[]
): Promise<{ results: unknown[]; aiInsight?: string } | null> {
    try {
        // Get basic search results
        const results = basicSearch(query, guides)

        // For now, return just the enhanced results
        // This can be extended to call the AI API for additional insights
        return {
            results,
            aiInsight: results.length > 0
                ? `Found ${results.length} relevant guides for your query`
                : 'No matching guides found. Try using different keywords.'
        }
    } catch (error) {
        console.error('Error in AI enhancement:', error)
        return null
    }
}
