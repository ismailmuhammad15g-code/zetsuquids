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
    // To avoid CORS issues and keep API keys secure, we ALWAYS route AI requests through our secure /api/ai server endpoint
    return await _fallbackToApiRoute(query, guides, userEmail, onToken, onDone, onError, needsSupport, relevantGuides);
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
        
        const relevantGuidesText = relevantGuides.length > 0 
            ? `\n### Relevant Guides from Website:\n${relevantGuides.slice(0, 5).map((g: any) => `Title: ${g.title || 'Untitled'}\nURL Path: /guides/${g.id}\nContent Snippet: ${(g.content || g.markdown || g.html_content || '').substring(0, 800)}...`).join('\n\n')}`
            : '\n### Relevant Guides: No specific guides found matching this query.';

        const userDataContext = `
### Real-Time User Data
You are currently talking to user: ${userEmail}
The user has published ${totalGuides} guides on the platform.
The user's guides have a total of ${totalViews} lifetime views and ${totalLikes} total likes.
${relevantGuidesText}

### Global Website Context (ZetsuGuide)
- You are a helpful AI assistant for ZetsuGuide.
- NEVER create a guide or use [ACTION:SAVE_GUIDE] unless the user explicitly asks for it (e.g. "Create a guide...", "Write a tutorial..."). 
- For simple greetings, questions, or casual chat, reply normally WITHOUT any action tags.
- For complex tasks (search, multi-step analysis), you MUST FIRST emit [ACTION:COMPUTER_OPEN] to show the workstation panel.

### Agentic AI Capabilities (MANDATORY):
1. UI Highlighting (CRITICAL): Whenever you mention or guide the user to a specific UI element (button, link, section), you MUST append the tag [ACTION:HIGHLIGHT:selector] at the end of your response. 
   Example: "Click the Explore Guides button. [ACTION:HIGHLIGHT:a[href="/guides"]]"

2. Long-Term Memory: To remember user preferences (e.g. language, goals, last project), output [ACTION:MEMORY:updated memory summary].

3. Smart Navigation & Guide Creation (CRITICAL): 
   - To create a new GUIDE (ONLY WHEN EXPLICITLY ASKED): 
     1. Write the full markdown guide content directly in the chat.
     2. At the absolute END of your response, output [ACTION:SAVE_GUIDE:Guide Title].
     The system will automatically save your writing as a private "AI Generated Guide" (visible only to the user).
   - If the user did NOT ask for a guide, DO NOT use this action.
   - Open specific page: \`\`\`json {"action": "redirect", "url": "/guides"} \`\`\`

4. Autonomous Execution Loop (REAL-TIME AGENT - CRITICAL):
   When the user asks a complex task:
   - You MUST first emit [ACTION:COMPUTER_OPEN] to show the workstation.
   - Break the task into atomic steps and work through each step automatically.
   
   AVAILABLE ACTION TAGS (Emit at the START of each step):
    - [ACTION:COMPUTER_OPEN] - use this FIRST to show the workstation panel.
    - [ACTION:COMPUTER_CLOSE] - use this LAST when the entire complex task is finished.
    - [ACTION:THOUGHT:your plan] - emit this after COMPUTER_OPEN to show reasoning.
    - [ACTION:SEARCH:query] - when gathering information.
    - [ACTION:WRITE:section] - when writing a section.
    - [ACTION:RESULT:summary] - summarize the key results.
    - [ACTION:STEP:label] - short label for the current step.
    - [ACTION:CONTINUE] - signal "I am not done, keep going automatically".
    - [ACTION:SAVE_GUIDE:Title] - save the guide (ONLY WHEN ASKED).
    - [ACTION:PUBLISH] - save/publish (only in editor).

   AGENTIC LOOP RULE (STRICT):
   - DO NOT perform multiple steps in a single response.
   - Emit ONE thought, ONE step, ONE action/result, and then [ACTION:CONTINUE].
   - STOP your response immediately after [ACTION:CONTINUE].
   - ONLY stop [ACTION:CONTINUE] when the entire request is 100% done.`;

        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: `${userDataContext}\n\nUser query: ${query}` }],
                userEmail,
                isDeepReasoning: false,
                isSubAgentMode: false,
                skipCreditDeduction: true,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API error:', response.status, errorText);
            onError('AI service is temporarily unavailable. Please try again in a moment.');
            onDone(doneData);
            return { needsSupport, results: relevantGuides };
        }

        const data = await response.json();
        
        // Extract content - the server now returns a standard structure
        const content: string = data.content || (data.choices?.[0]?.message?.content) || '';
        
        if (content && content.trim()) {
            // Pseudo-streaming for better UX
            const chunks = content.match(/[\s\S]{1,10}/g) || [content];
            for (const chunk of chunks) {
                onToken(chunk);
                await new Promise(r => setTimeout(r, 5)); // Slightly slower for readability
            }
        } else {
            console.error('Empty content from AI API:', data);
            onError('The AI returned an empty response. Please try rephrasing your question.');
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
