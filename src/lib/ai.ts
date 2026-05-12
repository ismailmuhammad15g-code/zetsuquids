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
    onDone: (data: { needsSupport: boolean; supportCategory?: string }) => void,
    onError: (err: string) => void
): Promise<{ needsSupport: boolean; supportCategory?: string; results?: unknown[] }> {
    const relevantGuides = basicSearch(query, guides);
    const supportKeywords = ['help', 'error', 'problem', 'not working', 'bug', 'issue', 'crash', 'failed'];
    const queryLower = query.toLowerCase();
    const needsSupport = supportKeywords.some(keyword => queryLower.includes(keyword));
    const doneData = { needsSupport, supportCategory: needsSupport ? 'technical_issue' : undefined };

    try {
        // Use Gemini directly — the env var stores a Gemini key and URL
        const apiKey = process.env.NEXT_PUBLIC_AI_API_KEY;
        const baseUrl = process.env.NEXT_PUBLIC_AI_API_URL ||
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        // Build Gemini-native request
        const geminiUrl = `${baseUrl}?key=${apiKey}`;
        const systemPrompt = `You are ZetsuGuide AI, an elite intelligent agent for the ZetsuGuide platform.
Answer the user's question with high quality markdown formatting.

### Core Capabilities & Markdown
- Use headers, bullet points, bold text, code blocks, and diagrams where relevant.
- ALWAYS use valid Mermaid syntax. When generating diagrams, you MUST wrap them in exactly \`\`\`mermaid and \`\`\`. Do not use any other language tag.
- Respond in the same language as the user (Arabic or English).

### Agentic Navigation
You have the power to navigate the user across the website. If the user asks to go to a specific page (e.g. "Take me to the AI page", "I want to see pricing", "Go to my profile", "انقلني لصفحة الذكاء الاصطناعي"), you MUST output a special action tag at the VERY END of your response.
Action Tag Format: [ACTION:REDIRECT:<url_path>]

Available Paths:
- / (Home)
- /guides (Browse Guides)
- /ai-drafts (ZetsuGuide AI / Drafts / AI tools)
- /pricing (Premium / Subscription)
- /community (Community Reviews)
- /auth (Login / Register)

Example:
User: "Can you take me to the AI draft page?"
ZetsuGuide AI: "Certainly! I am redirecting you to the ZetsuGuide AI page now.
[ACTION:REDIRECT:/ai-drafts]"`;

        // Pre-compute user stats
        const userGuides = (guides as any[]).filter(g => g.user_email === userEmail || g.author_email === userEmail);
        const totalGuides = userGuides.length;
        const totalViews = userGuides.reduce((acc, g) => acc + (g.views_count || g.views || 0), 0);
        const totalLikes = userGuides.reduce((acc, g) => acc + (g.likes_count || g.likes || 0), 0);
        
        const userDataContext = `
### Real-Time User Data
You are currently talking to user: ${userEmail}
The user has published ${totalGuides} guides on the platform.
The user's guides have a total of ${totalViews} lifetime views and ${totalLikes} total likes.
Use this context to accurately answer any questions the user has about their own stats, guides, or progress.`;

        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userDataContext}\n\nUser question: ${query}` }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7,
            }
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', response.status, errText);
            // Fallback to /api/ai route
            return await _fallbackToApiRoute(query, guides, userEmail, onToken, onDone, onError, needsSupport, relevantGuides);
        }

        const data = await response.json();
        const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (!content) {
            onError('The AI returned an empty response. Please try again.');
            onDone(doneData);
            return { needsSupport, results: relevantGuides };
        }

        // Simulate streaming extremely fast for a "lightning" feel
        const chunks = content.match(/[\s\S]{1,15}/g) || [content];
        for (const chunk of chunks) {
            onToken(chunk);
            await new Promise(r => setTimeout(r, 2));
        }
        onDone(doneData);
        return { needsSupport, results: relevantGuides };

    } catch (error) {
        console.error('Error in streamAIResponse:', error);
        onError('Connection error. Please check your network and try again.');
        return { needsSupport: false };
    }
}

async function _fallbackToApiRoute(
    query: string,
    _guides: unknown[],
    userEmail: string,
    onToken: (token: string) => void,
    onDone: (data: { needsSupport: boolean; supportCategory?: string }) => void,
    onError: (err: string) => void,
    needsSupport: boolean,
    relevantGuides: unknown[]
): Promise<{ needsSupport: boolean; supportCategory?: string; results?: unknown[] }> {
    const doneData = { needsSupport, supportCategory: needsSupport ? 'technical_issue' : undefined };
    try {
        // Pre-compute user stats for fallback
        const userGuides = (_guides as any[]).filter(g => g.user_email === userEmail || g.author_email === userEmail);
        const totalGuides = userGuides.length;
        const totalViews = userGuides.reduce((acc, g) => acc + (g.views_count || g.views || 0), 0);
        const totalLikes = userGuides.reduce((acc, g) => acc + (g.likes_count || g.likes || 0), 0);
        
        const userDataContext = `
### Real-Time User Data
You are currently talking to user: ${userEmail}
The user has published ${totalGuides} guides on the platform.
The user's guides have a total of ${totalViews} lifetime views and ${totalLikes} total likes.`;

        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: `${userDataContext}\n\nUser query: ${query}` }],
                model: 'gemini-1.5-flash',
                userEmail,
                isDeepReasoning: false,
                isSubAgentMode: false,
                skipCreditDeduction: true,
            }),
        });

        if (!response.ok) {
            onError('AI service is temporarily unavailable. Please try again in a moment.');
            onDone(doneData);
            return { needsSupport, results: relevantGuides };
        }

        const data = await response.json();
        const content: string = data.content ?? '';
        if (content) {
            const chunks = content.match(/[\s\S]{1,15}/g) || [content];
            for (const chunk of chunks) {
                onToken(chunk);
                await new Promise(r => setTimeout(r, 2));
            }
        } else {
            onError('No response received from AI.');
        }
        onDone(doneData);
        return { needsSupport, results: relevantGuides };
    } catch {
        onError('Connection error. Please try again.');
        onDone(doneData);
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
