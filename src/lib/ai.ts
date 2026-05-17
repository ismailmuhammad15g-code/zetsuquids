// Intelligent Search Engine
// Enhanced database-powered search with fuzzy matching, typo tolerance, and multi-entity search

import { communityApi } from "./communityApi";

// Levenshtein distance for fuzzy/typo-tolerant matching
function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// Check if two strings are fuzzy matches (typo tolerance)
function isFuzzyMatch(target: string, query: string, maxDistance: number = 2): boolean {
    if (target.length < 3 || query.length < 3) return false;
    const distance = levenshtein(target, query);
    const threshold = Math.min(maxDistance, Math.floor(query.length / 3));
    return distance <= threshold;
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
        'about', 'عن', 'في', 'من', 'إلى', 'على', 'مع', 'هل', 'ما', 'كيف', 'أين', 'متى', 'لماذا',
        'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي', 'و', 'أو', 'لكن', 'ثم', 'أن', 'إن',
        'كان', 'يكون', 'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'لا', 'نعم', 'كل', 'بعض'
    ]);

    return query
        .toLowerCase()
        .split(/[\s,،.؟?!]+/)
        .filter(word => word.length > 1 && !stopWords.has(word));
}

// Enhanced basic search with fuzzy matching and better scoring
export function basicSearch(query: string, guides: unknown[]): unknown[] {
    if (!guides || guides.length === 0) return [];
    if (!query || !query.trim()) return guides;

    const q = query.toLowerCase().trim();
    const keywords = extractKeywords(query);

    if (keywords.length === 0 && q.length < 2) return [];

    interface GuideItem {
        title?: string;
        content?: string;
        markdown?: string;
        html_content?: string;
        keywords?: string[];
        author_name?: string;
        author_email?: string;
        user_email?: string;
        tags?: string[];
        category?: string;
    }

    interface ScoredGuide extends GuideItem {
        score: number;
        matchReason?: string;
        [key: string]: unknown;
    }

    const scored: ScoredGuide[] = (guides as GuideItem[]).map((guide) => {
        let score = 0;
        let matchReason = '';
        const title = (guide.title || '').toLowerCase();
        const content = (guide.content || guide.markdown || guide.html_content || '').toLowerCase();
        const keywordsArr = Array.isArray(guide.keywords)
            ? guide.keywords.map(k => (k || '').toLowerCase())
            : [];
        const tags = Array.isArray(guide.tags)
            ? guide.tags.map(t => (t || '').toLowerCase())
            : [];
        const category = (guide.category || '').toLowerCase();
        const author = (guide.author_name || guide.author_email || guide.user_email || '').toLowerCase();

        // 1. Exact title match (highest priority)
        if (title === q) { score += 200; matchReason = 'exact title'; }
        else if (title.includes(q)) { score += 100; matchReason = 'title contains'; }
        else if (title.startsWith(q)) { score += 80; matchReason = 'title starts with'; }

        // 2. Fuzzy title match (typo tolerance)
        if (score === 0 && q.length >= 3) {
            const titleWords = title.split(/\s+/);
            for (const tw of titleWords) {
                if (isFuzzyMatch(tw, q)) {
                    score += 40;
                    matchReason = 'fuzzy title';
                    break;
                }
            }
        }

        // 3. Keyword exact match
        keywordsArr.forEach(kw => {
            if (kw === q) { score += 80; matchReason = matchReason || 'exact keyword'; }
            else if (kw.includes(q) || q.includes(kw)) { score += 40; matchReason = matchReason || 'keyword partial'; }
        });

        // 4. Fuzzy keyword match
        if (score < 40) {
            keywordsArr.forEach(kw => {
                if (isFuzzyMatch(kw, q)) {
                    score += 25;
                    matchReason = matchReason || 'fuzzy keyword';
                }
            });
        }

        // 5. Tag match
        tags.forEach(tag => {
            if (tag === q) score += 60;
            else if (tag.includes(q) || q.includes(tag)) score += 30;
        });

        // 6. Category match
        if (category && (category.includes(q) || q.includes(category))) {
            score += 25;
        }

        // 7. Author match
        if (author && (author.includes(q) || q.includes(author))) {
            score += 15;
        }

        // 8. Content contains full query
        if (content.includes(q)) {
            score += 50;
            matchReason = matchReason || 'content match';
        }

        // 9. Individual keyword matching with fuzzy support
        keywords.forEach(keyword => {
            if (keyword.length >= 2) {
                // Title word match
                if (title.includes(keyword)) score += 30;
                if (title.startsWith(keyword)) score += 20;

                // Fuzzy match against title words
                const titleWords = title.split(/\s+/);
                for (const tw of titleWords) {
                    if (isFuzzyMatch(tw, keyword)) {
                        score += 15;
                        break;
                    }
                }

                // Keyword array match
                keywordsArr.forEach(kw => {
                    if (kw === keyword) score += 25;
                    else if (kw.includes(keyword) || keyword.includes(kw)) score += 15;
                });

                // Content word match
                if (content.includes(keyword)) score += 10;
            }
        });

        return { ...guide, score, matchReason };
    });

    return scored.filter((g) => g.score > 0).sort((a, b) => b.score - a.score);
}

// Search people (users) via database
export async function searchPeople(query: string): Promise<unknown[]> {
    if (!query || query.trim().length < 2) return [];
    try {
        const results = await communityApi.searchUsers(query.trim());
        return results || [];
    } catch (err) {
        console.error("People search error:", err);
        return [];
    }
}

// Search posts via database
export async function searchPosts(query: string): Promise<unknown[]> {
    if (!query || query.trim().length < 2) return [];
    try {
        const results = await communityApi.searchPosts(query.trim());
        return results || [];
    } catch (err) {
        console.error("Posts search error:", err);
        return [];
    }
}

// Get trending guides sorted by views
export async function getTrendingGuides(limit: number = 5): Promise<unknown[]> {
    try {
        const { guidesApi } = await import("./api");
        const allGuides = await guidesApi.getAll();
        return (allGuides as { views_count?: number }[])
            .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
            .slice(0, limit);
    } catch (err) {
        console.error("Trending guides error:", err);
        return [];
    }
}

// Get trending hashtags from community
export async function getTrendingTags(limit: number = 8): Promise<{ tag: string; posts_count: number }[]> {
    try {
        const trends = await communityApi.getTrends(limit);
        return (trends || []).map((t: { tag: string; posts_count?: number }) => ({
            tag: t.tag,
            posts_count: t.posts_count || 0,
        }));
    } catch (err) {
        console.error("Trending tags error:", err);
        return [];
    }
}

// Fuzzy suggestion: find close matches when no results
export function getFuzzySuggestions(query: string, guides: unknown[], limit: number = 3): unknown[] {
    if (!query || !guides || guides.length === 0) return [];
    const q = query.toLowerCase().trim();
    const suggestions: { guide: unknown; distance: number }[] = [];

    for (const guide of guides as { title?: string }[]) {
        const title = (guide.title || "").toLowerCase();
        if (title.length < 2) continue;
        const words = title.split(/\s+/);
        let minDist = Infinity;
        for (const word of words) {
            const dist = levenshtein(word, q);
            if (dist < minDist) minDist = dist;
        }
        // Also check full title
        const fullDist = levenshtein(title, q);
        minDist = Math.min(minDist, fullDist);
        if (minDist <= Math.max(3, Math.floor(q.length / 2))) {
            suggestions.push({ guide, distance: minDist });
        }
    }

    return suggestions
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(s => s.guide);
}

// isAIConfigured kept for backward compatibility with Chatbot.tsx
export function isAIConfigured(): boolean {
    return true;
}

// streamAIResponse kept for Chatbot.tsx - NOT used by search
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
   When the user asks a complex task, follow this EXACT sequence:

   STEP 1 - OPEN & PLAN (FIRST response):
   - Emit [ACTION:COMPUTER_OPEN] to show the workstation.
   - Emit [ACTION:THOUGHT:reasoning about the task] to explain your approach.
   - Emit ONE [ACTION:PLAN:step description] for EACH planned step. Example:
     [ACTION:PLAN:Research latest AI tools for 2026]
     [ACTION:PLAN:Compile findings into a structured list]
     [ACTION:PLAN:Present results to the user]
   - Then emit [ACTION:STEP:first step label] and do the first step.
   - End with [ACTION:CONTINUE].

   STEP 2+ - EXECUTE (subsequent responses):
   - Complete ONE atomic action per response.
   - After completing a step, emit [ACTION:TASK_DONE:step description] to mark it complete.
   - Then emit [ACTION:STEP:next step label] for the next step.
   - End with [ACTION:CONTINUE] to proceed.

   FINAL STEP - FINISH (LAST response):
   - After ALL tasks are done, emit [ACTION:TASK_DONE:last task].
   - Then emit [ACTION:RESULT:final summary of what was accomplished].
   - FINALLY emit [ACTION:WORK_FINISHED] as the ABSOLUTE LAST tag.
   - NEVER forget [ACTION:WORK_FINISHED] - the system will loop infinitely without it.

   AVAILABLE ACTION TAGS:
    - [ACTION:COMPUTER_OPEN] - show the workstation panel (use FIRST).
    - [ACTION:COMPUTER_CLOSE] - close workstation (alternative to WORK_FINISHED).
    - [ACTION:PLAN:description] - declare a planned task step (shown in UI task list).
    - [ACTION:TASK_DONE:description] - mark a planned task as completed.
    - [ACTION:THOUGHT:reasoning] - show your reasoning.
    - [ACTION:STEP:label] - label for the current step.
    - [ACTION:SEARCH:query] - when searching for information.
    - [ACTION:WRITE:section] - when writing content.
    - [ACTION:RESULT:summary] - summarize results.
    - [ACTION:CONTINUE] - signal "I am not done, proceed to next step".
    - [ACTION:SAVE_GUIDE:Title] - save a guide (ONLY WHEN ASKED).
    - [ACTION:WORK_FINISHED] - signal task is COMPLETE (MANDATORY last tag).

   CRITICAL RULES:
   - Always emit PLAN tags before starting execution.
   - Always emit TASK_DONE after completing each planned step.
   - Always emit WORK_FINISHED at the very end. NO EXCEPTIONS.
   - ONE action per response. The system auto-triggers the next step.
   - Maximum 25 steps. Finish before hitting the limit.`;

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
        const content: string = data.content || (data.choices?.[0]?.message?.content) || '';

        if (content && content.trim()) {
            const chunks = content.match(/[\s\S]{1,10}/g) || [content];
            for (const chunk of chunks) {
                onToken(chunk);
                await new Promise(r => setTimeout(r, 5));
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

// aiAgentSearch kept for Chatbot.tsx - NOT used by search
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
