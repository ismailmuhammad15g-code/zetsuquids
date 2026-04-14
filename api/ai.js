import { createClient } from "@supabase/supabase-js";

// ============ DEEP RESEARCH AGENT ============

// 1. Generate search queries (Brainstorming)
async function generateSearchQueries(query, aiApiKey, aiUrl) {
  try {
    console.log("🧠 Generating research queries for:", query);

    // Convert to Gemini format
    const contents = [
      {
        role: "user",
        parts: [{ text: `You are a research planner. Generate 3 distinct search queries to gather comprehensive information about the user's request. Return ONLY a JSON array of strings. Example: ["react hooks tutorial", "react useeffect best practices", "react custom hooks examples"]` }]
      },
      {
        role: "user",
        parts: [{ text: query }]
      }
    ];

    const response = await fetch(`${aiUrl}?key=${aiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.5,
        }
      }),
    });

    if (!response.ok) return [query];

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    try {
      // Try to parse JSON array
      const queries = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      if (Array.isArray(queries)) {
        return queries.slice(0, 3);
      }
    } catch (e) {
      // Fallback if not valid JSON
      console.warn("Could not parse queries JSON, using raw lines");
      return content
        .split("\n")
        .slice(0, 3)
        .map((s) => s.replace(/^\d+\.\s*/, "").trim());
    }

    return [query];
  } catch (error) {
    console.error("❌ Query generation error:", error);
    return [query];
  }
}

// 2. Fetch and parse HTML content (direct, no API)
async function fetchAndParseContent(url) {
  try {
    // console.log(`📄 Fetching content from: ${url}`); // Keep logs quieter

    // Respect User-Agent and rate limiting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // console.warn(`⚠️ Failed to fetch ${url} - status ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Simple HTML parsing (extract text content)
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gs, "") // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gs, "") // Remove styles
      .replace(/<noscript[^>]*>.*?<\/noscript>/gs, "") // Remove noscript
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .substring(0, 15000); // Limit to 15k chars for deep reading

    if (text.trim().length < 200) {
      return null;
    }

    // console.log(`✅ Fetched ${text.length} characters from ${url}`);
    return text;
  } catch (error) {
    // console.error(`❌ Fetch error from ${url}:`, error.message);
    return null;
  }
}

// 3. Search DuckDuckGo (HTML scraping)
async function searchDuckDuckGo(query) {
  try {
    console.log(`🔍 Scraping DuckDuckGo for: ${query}`);

    const encodedQuery = encodeURIComponent(query);
    const ddgUrl = `https://duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(ddgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 8000,
    }); // 8s timeout

    if (!response.ok) return [];

    const html = await response.text();

    // Extract links from DuckDuckGo HTML
    const linkRegex = /<a rel="noopener" class="result__a" href="([^"]+)"/g;
    const matches = [...html.matchAll(linkRegex)].slice(0, 4); // Top 4 results

    const urls = matches
      .map((m) => {
        try {
          return new URL(m[1]).href;
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);

    return urls;
  } catch (error) {
    console.error("❌ DuckDuckGo search error:", error.message);
    return [];
  }
}

// 4. MAIN AGENT: Deep Research Logic
// 4. MAIN AGENT: Deep Research Logic
async function deepResearch(query, aiApiKey, aiUrl, providedQueries = null) {
  try {
    // Step 1: Brainstorm queries (or use provided strategy)
    let queries = [];
    if (
      providedQueries &&
      Array.isArray(providedQueries) &&
      providedQueries.length > 0
    ) {
      console.log("🤔 Using strategy-provided queries:", providedQueries);
      queries = providedQueries;
    } else {
      queries = await generateSearchQueries(query, aiApiKey, aiUrl);
      console.log("🤔 Research Plan:", queries);
    }

    // Step 2: Search for each query in parallel
    const searchPromises = queries.map((q) => searchDuckDuckGo(q));
    const searchResults = await Promise.all(searchPromises);

    // Flatten and deduplicate URLs
    const allUrls = [...new Set(searchResults.flat())];
    console.log(`🔎 Found ${allUrls.length} unique sources to analyze`);

    // Step 3: Fetch content from top sources (max 5)
    // Prioritize likely useful sources based on keywords
    const prioritizedUrls = allUrls
      .sort((a, b) => {
        const score = (url) => {
          let s = 0;
          if (url.includes("github.com")) s += 2;
          if (url.includes("stackoverflow.com")) s += 2;
          if (url.includes("wikipedia.org")) s += 1;
          if (url.includes("docs")) s += 1;
          return s;
        };
        return score(b) - score(a);
      })
      .slice(0, 5);

    const contentPromises = prioritizedUrls.map((url) =>
      fetchAndParseContent(url).then((content) => ({ url, content })),
    );
    const contents = await Promise.all(contentPromises);

    const validSources = contents.filter((c) => c.content !== null);

    console.log(`📚 Analyzed ${validSources.length} sources successfully`);

    if (validSources.length > 0) {
      return {
        sources: validSources.map((s) => ({ ...s, method: "deep-research" })),
        success: true,
      };
    }

    return { sources: [], success: false };
  } catch (error) {
    console.error("❌ Deep Research error:", error);
    return { sources: [], success: false };
  }
}

// ============ SUB-AGENTS ============

// 🧠 SubAgent 1: Planner Agent
async function runPlannerAgent(query, apiKey, apiUrl, model) {
  console.log("🧠 [Planner Agent] Analyzing query...");
  try {
    const response = await fetchWithExponentialBackoff(
      apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are the STRATEGIC PLANNER AGENT.
Your goal is to break down the user's query into a clear execution plan.

OUTPUT FORMAT: JSON ONLY.
{
  "intent": "Brief description of user intent",
  "complexity": "Beginner/Intermediate/Advanced",
  "subtopics": ["Concept 1", "Concept 2", "Concept 3"],
  "research_queries": ["Search Query 1", "Search Query 2", "Search Query 3"],
  "required_knowledge": "What key concepts do we need to explain?"
}
Keep it concise.`,
            },
            { role: "user", content: query },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      },
      2,
    );

    const data = await response.json();
    let plan = {};
    try {
      if (data?.choices?.[0]?.message?.content) {
        plan = JSON.parse(data.choices[0].message.content);
      } else {
        throw new Error("Empty planner response");
      }
    } catch (e) {
      console.warn("⚠️ Planner output parsing failed, using fallback.");
      plan = { subtopics: [query], research_queries: [query] };
    }
    console.log("✅ [Planner Agent] Plan created:", plan.intent);
    return plan;
  } catch (e) {
    console.error("❌ Planner Agent Failed:", e);
    return { subtopics: [query], research_queries: [query] };
  }
}

// 📚 SubAgent 2: Core Knowledge Agent
async function runCoreKnowledgeAgent(query, plan, apiKey, apiUrl, model) {
  console.log("📚 [Core Knowledge Agent] Extracting insights...");
  try {
    const subtopics = plan.subtopics ? plan.subtopics.join(", ") : query;
    const response = await fetchWithExponentialBackoff(
      apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are the CORE KNOWLEDGE AGENT.
Extract the 5-10 most critical foundational insights about: "${query}"
Focus on these subtopics: ${subtopics}

Return them as a structured list of 'Mini-Articles' or 'Key Facts'.
Remove redundancy. Ensure logical completeness.
Do NOT explain everything, just provide the raw internal knowledge blocks.`,
            },
            { role: "user", content: "Extract core knowledge now." },
          ],
          temperature: 0.4,
        }),
      },
      2,
    );

    const data = await response.json();
    const insights =
      data?.choices?.[0]?.message?.content ||
      "No internal knowledge extracted.";
    console.log("✅ [Core Knowledge Agent] Extraction complete.");
    return insights;
  } catch (e) {
    console.error("❌ Core Knowledge Agent Failed:", e);
    return "Internal knowledge extraction failed.";
  }
}

// 5. DEEP REASONING AGENT (3-Stage Pipeline)
// 🔬 SubAgent 4: Analyst Agent
async function runAnalystAgent(
  query,
  knowledge,
  researchData,
  plan,
  apiKey,
  apiUrl,
  model,
) {
  console.log("🔬 [Analyst Agent] Synthesizing and analyzing...");
  try {
    const response = await fetchWithExponentialBackoff(
      apiUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: `You are the ANALYST AGENT.
Your task: Merge Internal Knowledge with External Research to create a coherent "Reasoning Map".

1. Detect contradictions (External data overrides Internal).
2. Address the user's complexity level: ${plan.complexity || "General"}.
3. Organize the data into a logical flow for the final answer.

CONTEXT:
--- INTERNAL KNOWLEDGE ---
${knowledge}

--- EXTERNAL RESEARCH ---
${researchData}

OUTPUT:
A structured analysis summary (Reasoning Map) that the Composer Agent will use to write the final response.
Highlight key points, accepted facts, and structure.`,
            },
            { role: "user", content: `Query: ${query}` },
          ],
          temperature: 0.5,
        }),
      },
      2,
    );

    const data = await response.json();
    const analysis =
      data?.choices?.[0]?.message?.content ||
      "Analysis failed due to empty response.";
    console.log("✅ [Analyst Agent] Analysis complete.");
    return analysis;
  } catch (e) {
    console.error("❌ Analyst Agent Failed:", e);
    return "Analysis failed. Using raw research data.";
  }
}

// ✍️ SubAgent 5: Composer Agent (Prompt Generator)
function generateComposerPrompt(query, analysis, plan) {
  console.log("✍️ [Composer Agent] Preparing final prompt...");
  return `You are the LEAD COMPOSER AGENT (SubAgent 5).

Your Goal: Transform the provided "Reasoning Map" into a perfect, polished user-facing response.

USER QUERY: "${query}"
TARGET COMPLEXITY: ${plan.complexity || "Adaptive"}

/// REASONING MAP (Source Material) ///
${analysis}
/// END MATERIAL ///

INSTRUCTIONS:
1. MASTERPIECE QUALITY: The output must be indistinguishable from a top-tier human expert (Professor/Senior Engineer).
2. STRUCTURE: Use clear H2/H3 headers, bullet points, and bold text for readability.
3. TONE: Engaging, educational, and authoritative.
4. CONTENT:
   - Start with a direct answer/summary.
   - deep dive into the details.
   - Use code blocks if technical.
   - Include a "Key Takeaways" or "Summary" section at the end.
5. NO METALANGUAGE: Do NOT say "Based on the reasoning map..." or "The analyst found...". Just write the answer directly.
6. JSON FORMAT: You MUST return the standard JSON object.

CRITICAL: RESPONSE FORMAT
Return a valid JSON object:
{
  "content": "markdown string...",
  "publishable": true,
  "suggested_followups": ["string", "string", "string"]
}
If JSON fails, return markdown.`;
}

// 5. SUB-AGENT ORCHESTRATOR (5-Stage Pipeline)
async function executeSubAgentWorkflow(
  query,
  apiKey,
  apiUrl,
  model,
  onProgress,
) {
  const log = (msg) => {
    console.log(msg);
    if (onProgress) onProgress(msg);
  };

  log("🧠 STARTING SUB-AGENT WORKFLOW...");

  // STAGE 1: PLANNER
  log("🧠 [Planner Agent] Analyzes intent and creates a research strategy...");
  const plan = await runPlannerAgent(query, apiKey, apiUrl, model);

  // STAGE 2: CORE KNOWLEDGE
  log("📚 [Core Knowledge Agent] Extracts internal foundational concepts...");
  const knowledge = await runCoreKnowledgeAgent(
    query,
    plan,
    apiKey,
    apiUrl,
    model,
  );

  // STAGE 3: RESEARCH
  log("🌍 [Research Agent] Executes targeted searches...");
  const researchQuery =
    plan.research_queries && plan.research_queries.length > 0
      ? plan.research_queries
      : [query];
  const researchResult = await deepResearch(
    query,
    apiKey,
    apiUrl,
    researchQuery,
  );
  const researchData = researchResult.success
    ? researchResult.sources
      .map((s) => `[SOURCE: ${s.url}] ${s.content.substring(0, 1000)}`)
      .join("\n\n")
    : "No new external data found (using internal knowledge).";

  // STAGE 4: ANALYST
  log("🔬 [Analyst Agent] Synthesizes internal and external data...");
  const analysis = await runAnalystAgent(
    query,
    knowledge,
    researchData,
    plan,
    apiKey,
    apiUrl,
    model,
  );

  // STAGE 5: COMPOSER
  log("✍️ [Composer Agent] Crafts the final masterpiece...");
  const systemPrompt = generateComposerPrompt(query, analysis, plan);

  log("✅ SUB-AGENT WORKFLOW COMPLETE. Generating final answer...");

  return {
    systemPrompt: systemPrompt,
  };
}

// 6. ORIGINAL DEEP REASONING (3-Stage Pipeline)
async function executeDeepReasoning(query, apiKey, apiUrl, model) {
  console.log("🧠 STARTING DEEP REASONING (Standard) for:", query);

  // STAGE 1: CORE KNOWLEDGE
  // Reuse the agent logic but simpler
  const plan = { subtopics: [query] }; // Dummy plan
  const coreerInsights = await runCoreKnowledgeAgent(
    query,
    plan,
    apiKey,
    apiUrl,
    model,
  );

  // STAGE 2: RESEARCH
  const researchResult = await deepResearch(query, apiKey, apiUrl);
  const externalData = researchResult.success
    ? researchResult.sources
      .map(
        (s) => `SOURCE: ${s.url}\nCONTENT: ${s.content.substring(0, 1500)}`,
      )
      .join("\n\n")
    : "No external data found.";

  // STAGE 3: SYNTHESIS
  const systemPrompt = `You are ZetsuGuide AI (Deep Reasoning Mode).

  CONTEXT:
  1. INTERNAL KNOWLEDGE:
  ${coreerInsights}

  2. EXTERNAL RESEARCH:
  ${externalData}

  TASK: Synthesize this into a comprehensive answer.
  Use Headers, Bullet Points, and Code Blocks.

  CRITICAL: RESPONSE FORMAT
  Return a valid JSON object:
  {
    "content": "markdown string...",
    "publishable": true,
    "suggested_followups": ["string"]
  }`;

  return { systemPrompt };
}

// Exponential backoff retry logic for API calls with intelligent wait times
async function fetchWithExponentialBackoff(url, options, maxRetries = 4) {
  let lastError;
  const waitTimes = [2000, 5000, 10000]; // 2s, 5s, 10s

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 API call attempt ${attempt}/${maxRetries}`);
      const controller = new AbortController();
      // Long timeout: 90 seconds for deep thought
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If successful, return immediately
      if (response.ok) {
        return response;
      }

      // For 504/503/429, we should retry
      if ([504, 503, 429].includes(response.status)) {
        console.warn(
          `⚠️ Server error ${response.status} on attempt ${attempt}, will retry`,
        );
        lastError = new Error(`HTTP ${response.status}`);

        // Don't retry on last attempt
        if (attempt < maxRetries) {
          const waitTime =
            waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1];
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }
      }

      // For other errors, return response as is
      return response;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      // If it's the last attempt, don't retry
      if (attempt >= maxRetries) {
        break;
      }

      // Retry on timeout, network errors, or "fetch failed" (undici error)
      const isTimeout = error.name === "AbortError" || error.message.toLowerCase().includes("timeout");
      const isNetworkError = error.message === "fetch failed" || error.code === "ETIMEDOUT" || error.code === "ECONNRESET";

      if (isTimeout || isNetworkError) {
        const waitTime =
          waitTimes[attempt - 1] || waitTimes[waitTimes.length - 1];
        console.log(`🔄 Retrying in ${waitTime}ms due to network/timeout error...`);
        await new Promise((r) => setTimeout(r, waitTime));
      } else {
        // For other errors (API usage errors, etc.), don't retry
        break;
      }
    }
  }

  throw lastError || new Error("API call failed after retries");
}

// ============ GEMINI HELPERS ============

/**
 * Converts OpenAI-style messages to Google Gemini format.
 * Gemini uses roles "user" and "model". "system" is moved to a prepended instruction.
 */
function toGeminiRequest(messages, model) {
  const contents = [];
  let systemInstruction = "";

  for (const m of messages) {
    if (m.role === "system") {
      systemInstruction += (systemInstruction ? "\n" : "") + m.content;
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      });
    }
  }

  const payload = { contents };

  if (systemInstruction) {
    payload.system_instruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  return payload;
}

/**
 * Safely parses a Gemini response or stream chunk.
 */
function extractGeminiText(data) {
  if (Array.isArray(data)) {
    // Some stream formats return an array of candidates
    return data.map(chunk => extractGeminiText(chunk)).join("");
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) { }
    }

    const { messages, model, userId, userEmail, skipCreditDeduction } =
      body || {};

    // Validate and set default model
    const validatedModel = model || "google/gemini-2.0-flash-exp:free";

    // Get the last user message for intelligent fetch
    const userMessage = messages?.find((m) => m.role === "user")?.content || "";

    // Get API credentials for source selection
    const apiKey = process.env.VITE_AI_API_KEY || process.env.ROUTEWAY_API_KEY;
    const apiUrl =
      process.env.VITE_AI_API_URL ||
      "https://api.routeway.ai/v1/chat/completions";

    // MODES
    const isDeepReasoning = body?.isDeepReasoning || false;
    const isSubAgentMode = body?.isSubAgentMode || false;

    console.log(
      `🚀 Starting AI Request. SubAgent: ${isSubAgentMode}, Deep Reasoning: ${isDeepReasoning}, Query:`,
      userMessage.substring(0, 100),
    );

    // Helper function to process AI response - MUST BE DEFINED BEFORE USE
    function processAIResponse(data) {
      // Enhanced validation
      if (!data || typeof data !== "object") {
        console.error(
          "❌ Invalid data object passed to processAIResponse:",
          typeof data,
        );
        return {
          content:
            "I apologize, but I received an invalid response format from the AI provider. Please try again.",
          publishable: false,
          suggested_followups: [],
        };
      }

      if (
        !data.choices ||
        !Array.isArray(data.choices) ||
        data.choices.length === 0
      ) {
        console.error(
          "❌ No choices array in data:",
          JSON.stringify(data).substring(0, 200),
        );
        return {
          content:
            "I apologize, but I received an incomplete response from the AI provider. Please try again.",
          publishable: false,
          suggested_followups: [],
        };
      }

      const aiResponseContent = data.choices?.[0]?.message?.content || "";
      const finishReason = data.choices?.[0]?.finish_reason;

      let parsedContent = null;
      let finalContent = aiResponseContent;
      let isPublishable = true;
      let suggestedFollowups = [];

      console.log("🤖 Raw AI Response:", aiResponseContent.substring(0, 200));
      console.log("🎯 Finish Reason:", finishReason);

      if (!aiResponseContent && finishReason) {
        console.warn(`⚠️ AI response empty. Finish reason: ${finishReason}`);
        if (finishReason === "content_filter") {
          finalContent =
            "I apologize, but I cannot answer this query due to safety content filters.";
          return {
            content: finalContent,
            publishable: false,
            suggested_followups: [],
          };
        }
        if (finishReason === "length") {
          finalContent =
            "I apologize, but the response was truncated due to length limits. Please try a more specific query.";
          return {
            content: finalContent,
            publishable: false,
            suggested_followups: [],
          };
        }
      }

      try {
        // Find JSON object using regex (first { to last })
        const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : aiResponseContent;

        // Try parsing
        try {
          parsedContent = JSON.parse(cleanJson);
        } catch (e) {
          parsedContent = JSON.parse(cleanJson.replace(/\n/g, "\\n"));
        }

        if (parsedContent && parsedContent.content) {
          finalContent = parsedContent.content;
          isPublishable = !!parsedContent.publishable;
          suggestedFollowups = Array.isArray(parsedContent.suggested_followups)
            ? parsedContent.suggested_followups.slice(0, 3)
            : [];
        } else {
          if (parsedContent && !parsedContent.content) {
            throw new Error("Missing content field");
          }
        }
      } catch (parseError) {
        console.warn("JSON Extraction/Parsing failed:", parseError.message);
        finalContent = aiResponseContent;
        isPublishable = aiResponseContent && aiResponseContent.length > 200;
      }

      // Final safety check
      if (!finalContent || !finalContent.trim()) {
        console.error(
          "❌ Final content is empty. Raw Data:",
          JSON.stringify(data).substring(0, 500),
        );
        console.error("Finish Reason:", finishReason);
        console.error("Parsed Content:", parsedContent);

        // Provide more helpful error message based on context
        if (finishReason === "content_filter") {
          finalContent =
            "I apologize, but I cannot answer this query due to safety content filters. Please rephrase your question.";
        } else if (finishReason === "length") {
          finalContent =
            "I apologize, but the response was truncated due to length limits. Please try a more specific or shorter query.";
        } else {
          finalContent = `I apologize, but I received an empty response from the AI provider. (Debug: Reason=${finishReason || "Unknown"}). Please try again or rephrase your question.`;
        }
        isPublishable = false;
      }

      console.log(
        `✅ Processed content length: ${finalContent.length}, publishable: ${isPublishable}`,
      );

      return {
        content: finalContent,
        publishable: isPublishable,
        suggested_followups: suggestedFollowups,
      };
    }

    // BRANCH 1: SUB-AGENT MODE (Non-Streaming - Vercel Compatible)
    if (isSubAgentMode && apiKey && userMessage && !skipCreditDeduction) {
      try {
        // Collect all progress updates
        const progressUpdates = [];

        const workflowResult = await executeSubAgentWorkflow(
          userMessage,
          apiKey,
          apiUrl,
          validatedModel,
          (progressMessage) => {
            progressUpdates.push(progressMessage);
            console.log("SubAgent Progress:", progressMessage);
          },
        );

        // Construct final prompt
        const finalMessages = [
          { role: "system", content: workflowResult.systemPrompt },
          { role: "user", content: "Generate the final response." },
        ];

        const requestPayload = {
          model: validatedModel,
          messages: finalMessages,
          max_tokens: 4000,
          temperature: 0.7,
        };

        // Log request details for debugging
        console.log("🔍 SubAgent Final Request:", {
          model: requestPayload.model,
          systemPromptLength: workflowResult.systemPrompt.length,
          messagesCount: finalMessages.length,
        });

        let aiData = null;
        let retryCount = 0;
        const maxRetries = 2;

        // Retry loop for empty responses
        while (retryCount <= maxRetries) {
          try {
            const response = await fetchWithExponentialBackoff(
              apiUrl,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestPayload),
              },
              4,
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error(
                `API returned error status ${response.status}:`,
                errorText,
              );
              throw new Error(
                `Final AI synthesis failed: ${response.status} - ${errorText}`,
              );
            }

            // Parse response
            const responseText = await response.text();
            console.log(
              "📥 API Response received, length:",
              responseText.length,
            );

            if (!responseText || responseText.trim().length === 0) {
              console.error("❌ Empty response body from API");
              throw new Error("API returned empty response body");
            }

            try {
              aiData = JSON.parse(responseText);
            } catch (parseError) {
              console.error("❌ JSON parse error:", parseError.message);
              console.error("Response text:", responseText.substring(0, 500));
              throw new Error(
                `Failed to parse API response: ${parseError.message}`,
              );
            }

            // Validate response structure
            if (!aiData) {
              throw new Error("Parsed aiData is null or undefined");
            }

            if (!aiData.choices || !Array.isArray(aiData.choices)) {
              console.error(
                "❌ Invalid response structure - missing or invalid choices array:",
                JSON.stringify(aiData).substring(0, 500),
              );
              throw new Error(
                "API response missing 'choices' array. Response structure invalid.",
              );
            }

            if (aiData.choices.length === 0) {
              console.error(
                "❌ Empty choices array in response:",
                JSON.stringify(aiData),
              );
              throw new Error("API returned empty choices array");
            }

            const messageContent = aiData.choices[0]?.message?.content;
            if (!messageContent || messageContent.trim().length === 0) {
              console.error(
                "❌ Empty message content:",
                JSON.stringify(aiData.choices[0]),
              );
              throw new Error("API returned empty message content");
            }

            // Success! Break out of retry loop
            console.log("✅ Valid AI response received");
            break;
          } catch (error) {
            retryCount++;
            console.error(
              `❌ Attempt ${retryCount}/${maxRetries + 1} failed:`,
              error.message,
            );

            if (retryCount > maxRetries) {
              // Final fallback: try with a simplified request
              console.log(
                "🔄 All retries exhausted. Trying fallback simplified request...",
              );

              const fallbackMessages = [
                {
                  role: "system",
                  content:
                    "You are a helpful AI assistant. Provide a clear, structured answer to the user's question.",
                },
                { role: "user", content: userMessage },
              ];

              const fallbackPayload = {
                model: model || "glm-4.5-air:free",
                messages: fallbackMessages,
                max_tokens: 2000,
                temperature: 0.7,
              };

              try {
                const fallbackResponse = await fetch(apiUrl, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(fallbackPayload),
                });

                if (fallbackResponse.ok) {
                  const fallbackText = await fallbackResponse.text();
                  if (fallbackText && fallbackText.trim().length > 0) {
                    aiData = JSON.parse(fallbackText);
                    if (
                      aiData?.choices?.[0]?.message?.content?.trim().length > 0
                    ) {
                      console.log(
                        "✅ Fallback request successful. Using simplified response.",
                      );
                      break;
                    }
                  }
                }
              } catch (fallbackError) {
                console.error(
                  "❌ Fallback also failed:",
                  fallbackError.message,
                );
              }

              throw new Error(
                `Final AI synthesis returned empty response after ${retryCount} attempts. The AI provider may be experiencing issues. Please try again in a moment.`,
              );
            }

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        // Process the AI response
        console.log("🔄 Processing AI response...");
        const processed = processAIResponse(aiData);

        // CRITICAL: Ensure we have content before sending
        if (
          !processed ||
          !processed.content ||
          processed.content.trim().length === 0
        ) {
          console.error("❌ Processed content is empty:", processed);
          throw new Error(
            "AI processing failed to generate valid content. The response was empty or invalid.",
          );
        }

        console.log(
          `✅ SubAgent workflow complete. Content length: ${processed.content.length}`,
        );

        // Return all data at once (Vercel compatible)
        return res.status(200).json({
          choices: aiData.choices,
          content: processed.content,
          publishable: processed.publishable || false,
          suggested_followups: processed.suggested_followups || [],
          sources: [],
          progressUpdates: progressUpdates, // Include progress for debugging
          isSubAgentMode: true,
        });
      } catch (error) {
        console.error("💥 SubAgent Error:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
          error: "SubAgent workflow failed",
          message:
            error.message ||
            "An unexpected error occurred in SubAgent workflow. Please try again.",
          details:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
      }
    }
    // BRANCH 2: DEEP REASONING MODE (Standard 3-Stage)
    else if (isDeepReasoning && apiKey && userMessage && !skipCreditDeduction) {
      const reasoningResult = await executeDeepReasoning(
        userMessage,
        apiKey,
        apiUrl,
        validatedModel,
      );

      messages.length = 0;
      messages.push({ role: "system", content: reasoningResult.systemPrompt });
      messages.push({ role: "user", content: "Generate the final response." });
    }
    // BRANCH 3: STANDARD MODE (Research Only)

    // If we reached here, continue with standard request processing
    // Deep Research: AI plans and executes multi-step research
    let fetchedSources = [];
    let systemPromptAddition = "";

    console.log(
      `🚀 Continuing with standard mode. Query:`,
      userMessage.substring(0, 100),
    );

    // BRANCH: STANDARD MODE (Existing Logic)
    if (userMessage && !skipCreditDeduction && apiKey) {
      const fetchResult = await deepResearch(userMessage, apiKey, apiUrl);

      console.log("📊 Deep Research result:", {
        success: fetchResult.success,
        sourceCount: fetchResult.sources?.length || 0,
      });

      if (fetchResult.success && fetchResult.sources.length > 0) {
        fetchedSources = fetchResult.sources;
        systemPromptAddition = `\n\n=== 🌍 REAL-TIME WEB INTELLIGENCE ===\n`;
        fetchResult.sources.forEach((source, idx) => {
          systemPromptAddition += `\n[Source ${idx + 1}] ${source.url}\nContent excerpt:\n${source.content?.substring(0, 2000) || "N/A"}\n`;
        });
        systemPromptAddition += `\n=== END OF WEB INTELLIGENCE ===\n\nINSTRUCTIONS: Use the above real-time data to answer. Cite sources using [1], [2] format where appropriate.`;
      } else {
        console.log(
          "⚠️ No web content fetched, will use guides and knowledge base only",
        );
      }
    } else {
      console.log("⚠️ Skipping research:", {
        hasMessage: !!userMessage,
        skipCredit: skipCreditDeduction,
        hasApiKey: !!apiKey,
      });
    }

    // Build enhanced system prompt with Mermaid support
    let systemPrompt = `You are ZetsuGuideAI, an elite expert assistant with REAL-TIME INTERNET ACCESS and DIAGRAM GENERATION capabilities.`;

    // PROMPT ENHANCER MODE: Bypass standard system prompt
    const isPromptEnhancement = body?.isPromptEnhancement || false;

    if (isPromptEnhancement) {
      // Just use the client provided messages directly
      const messagesWithSearch = messages;

      const requestPayload = {
        model: validatedModel,
        messages: messagesWithSearch,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      };

      const response = await fetchWithExponentialBackoff(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      // Return raw response for enhancement
      if (!response.ok) {
        const errorData = await response.text();
        return res.status(response.status).json({ error: errorData });
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // Append client-provided system context (guides) which contains local knowledge
    const clientSystemMessage =
      messages?.find((m) => m.role === "system")?.content || "";
    if (clientSystemMessage) {
      // Extract just the relevant parts if needed, or append the whole thing
      // The client sends a large prompt, we only want the context part usually,
      // but appending it as "Internal Context" is safe.
      systemPrompt += `\n\n=== INTERNAL KNOWLEDGE BASE ===\n${clientSystemMessage} \n === END OF INTERNAL KNOWLEDGE ===\n`;
    }

    systemPrompt += `
CORE CAPABILITIES:
1. 🌍 **LIVE WEB ACCESS**: You have just researched the user's query online. Use the provided "WEB INTELLIGENCE" to answer with up-to-the-minute accuracy.
2. 📊 **DIAGRAMS**: You can generate mermaid charts to explain complex topics.
3. 🧠 **DEEP UNDERSTANDING**: You analyze multiple sources to provide comprehensive, verified answers.
4. 🤖 **SMART AGENT**: You can suggest follow-up questions to help the user learn more.

DIAGRAM INSTRUCTIONS:
- Use Mermaid syntax to visualize flows, architectures, or relationships.
- Wrap Mermaid code in a code block with language \`mermaid\`.
- Example:
\`\`\`mermaid
graph TD
    A[Start] --> B{Is Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Error]
\`\`\`
- Use diagrams when explaining: workflows, system architectures, decision trees, or timelines.

GENERAL INSTRUCTIONS:
- ANSWER COMPREHENSIVELY: Minimum 300 words for complex topics.
- CITE SOURCES: Use [Source 1], [Source 2] etc. based on the Web Intelligence provided.
- BE CURRENT: If the user asks about recent events/versions, use the Web Intelligence data.
- FORMATTING: Use bolding, lists, and headers to make text readable.
- LANGUAGE: Respond in the SAME LANGUAGE as the user's question (Arabic/English).

CRITICAL: RESPONSE FORMAT
When streaming, respond with pure markdown text directly. Just provide your answer as markdown content.
Do NOT return JSON when streaming. Return the markdown content directly so it can be streamed token by token.
Example response:
## Your Answer Title

Here is the explanation...

\`\`\`javascript
// code example
\`\`\`

**Key Points:**
- Point 1
- Point 2
`;

    // Add fetched content directly to the system prompt
    if (systemPromptAddition) {
      systemPrompt += systemPromptAddition;
    }

    if (!apiKey) {
      return res.status(500).json({ error: "Missing AI API Key" });
    }

    // Build messages with enhanced system prompt
    const messagesWithSearch = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role !== "system"),
    ];

    // Check if streaming is supported (Node.js environment)
    const supportsStreaming =
      typeof res.write === "function" && typeof res.end === "function";

    // Determine if we want streaming (explicitly requested OR credit deduction requires it)
    // But only if streaming is actually supported in this environment
    const userRequestsStream = req.body.stream === true;
    const wantsStream = supportsStreaming && userRequestsStream;

    const endpoint = wantsStream
      ? apiUrl.replace(":generateContent", ":streamGenerateContent")
      : apiUrl;

    const geminiPayload = toGeminiRequest(messagesWithSearch, validatedModel);
    geminiPayload.generationConfig = {
      maxOutputTokens: 4000,
      temperature: 0.7,
    };

    // Normal flow with credit deduction handled conditionally below
    if (!skipCreditDeduction && !userId && !userEmail) {
      return res
        .status(400)
        .json({ error: "User ID or email is required for credit usage." });
    }

    console.log("AI Request:", {
      userId,
      userEmail,
      model: model || "google/gemini-2.0-flash-exp:free",
      messageLength: userMessage.length,
      isSubAgent: isSubAgentMode,
      isDeepReasoning: isDeepReasoning,
    });

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase Config:", {
        url: !!supabaseUrl,
        key: !!supabaseServiceKey,
      });
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const lookupEmail = userEmail ? userEmail.toLowerCase() : userId;
    let currentCredits = 100;

    // Handle credit deduction ONLY if not skipping
    if (!skipCreditDeduction) {
      // Check if user exists in credits table
      const { data: creditData, error: creditError } = await supabase
        .from("zetsuguide_credits")
        .select("credits")
        .eq("user_email", lookupEmail)
        .maybeSingle();

      if (creditError) {
        console.error("Error fetching credits:", creditError);
        // Return details for debugging
        return res.status(500).json({
          error: "Failed to verify credits",
          details: creditError.message,
          hint: "Please ensure the 'zetsuguide_credits' table exists.",
        });
      }

      if (!creditData) {
        // User doesn't exist in table yet, create them with default credits
        console.log(
          `User ${lookupEmail} not found in credits table. Creating default entry...`,
        );
        const { data: newCreditData, error: insertError } = await supabase
          .from("zetsuguide_credits")
          .insert([{ user_email: lookupEmail, credits: 10 }]) // Default 10 credits
          .select("credits")
          .single();

        if (insertError) {
          console.error("Error creating default credits:", insertError);
          return res.status(500).json({
            error: "Failed to initialize user credits",
            details: insertError.message,
          });
        }

        currentCredits = newCreditData?.credits || 10;
      } else {
        currentCredits = creditData.credits;
      }

      console.log(`User ${lookupEmail} has ${currentCredits} credits.`);

      if (currentCredits < 1) {
        return res.status(403).json({
          error: "Insufficient credits. Please refer friends to earn more!",
        });
      }

      // Deduct credit BEFORE streaming starts
      const { error: deductError } = await supabase
        .from("zetsuguide_credits")
        .update({
          credits: currentCredits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", lookupEmail);

      if (deductError) {
        console.error("Failed to deduct credit:", deductError);
      } else {
        console.log(
          `Deducted 1 credit for user ${lookupEmail}. New balance: ${currentCredits - 1}`,
        );
      }
    }

    // ═══════════════════════════════════════════════════════
    // MAIN AI REQUEST FLOW (for all cases)
    // ═══════════════════════════════════════════════════════

    let response;
      try {
        // Determine request parameters based on whether we want streaming
        let fetchUrl = endpoint;

        // Always add API key to URL for Gemini
        // But first check if endpoint already has query params
        const hasQueryParams = endpoint.includes("?");
        if (!endpoint.includes("key=")) {
          fetchUrl = hasQueryParams
            ? `${endpoint}&key=${apiKey}`
            : `${endpoint}?key=${apiKey}`;
        }

        // For streaming, add the alt=sse parameter
        if (wantsStream && endpoint.includes("generateContent")) {
          const hasParams = fetchUrl.includes("?");
          fetchUrl = hasParams
            ? `${fetchUrl}&alt=sse`
            : `${fetchUrl}?alt=sse`;
          console.log("🚀 Sending request to Gemini STREAMING API:", {
            model: validatedModel,
            messageCount: messagesWithSearch.length,
            streaming: true,
          });
        } else {
          console.log("🚀 Sending request to AI API (non-streaming):", {
            model: validatedModel,
            messageCount: messagesWithSearch.length,
            streaming: false,
          });
        }

        const fetchOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(geminiPayload),
        };

        response = await fetch(fetchUrl, fetchOptions);

        console.log("📥 Received response:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          hasBody: !!response.body,
        });
      } catch (fetchError) {
        console.error("❌ API failed:", fetchError);
        return res.status(504).json({
          error: "AI service unavailable",
          details: "The AI service is temporarily unavailable. Please try again.",
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ AI API error:", response.status, errorText);
        return res.status(response.status).json({
          error: `AI Service Error (${response.status})`,
          details: "Please try again in a moment.",
        });
      }

      // Branch based on whether streaming is actually happening
      console.log("Response Processing:", {
        wantsStream,
        supportsStreaming,
        resWriteType: typeof res.write,
        resEndType: typeof res.end,
      });

      if (wantsStream && supportsStreaming) {
        // Create a compatible reader for both Web Streams and Node Streams
        let reader;

        if (response.body && typeof response.body.getReader === "function") {
          reader = response.body.getReader();
        } else if (
          response.body &&
          typeof response.body[Symbol.asyncIterator] === "function"
        ) {
          // Node.js PassThrough/Readable stream
          const iterator = response.body[Symbol.asyncIterator]();
          reader = {
            read: async () => {
              const { done, value } = await iterator.next();
              return { done, value };
            },
          };
        }

        // Verify we have a valid reader
        if (!reader) {
          console.error("❌ AI provider did not return a readable stream!");
          console.error("Response body type:", typeof response.body);

          // Fallback: try to read as text
          const text = await response.text();
          console.log(
            "Response as text (first 200 chars):",
            text.substring(0, 200),
          );

          return res.status(502).json({
            error: "AI service returned invalid streaming response",
            details:
              "The AI provider is not responding with a proper stream format.",
          });
        }

        // Set up Server-Sent Events (SSE) for real streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        console.log("✅ Starting REAL STREAMING to client...");

        // Send initial metadata
        res.write(
          `data: ${JSON.stringify({ type: "start", sources: fetchedSources.map((s) => ({ url: s.url, method: s.method })) })}\n\n`,
        );
        const decoder = new TextDecoder();
        let buffer = "";
        let totalTokensSent = 0; // Track if we're actually receiving content
        let chunkCount = 0;
        let debugFirstChunks = []; // Store first few chunks for debugging

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log(
                "✅ Stream completed - Total tokens sent:",
                totalTokensSent,
                "from",
                chunkCount,
                "chunks",
              );
              if (totalTokensSent === 0) {
                console.error(
                  "⚠️⚠️ ERROR: Stream completed but NO tokens were extracted!",
                );
                console.error("First 3 chunks received:", debugFirstChunks);
                console.error("Last buffer content:", buffer);
              }
              res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
              res.end();
              break;
            }

            chunkCount++;
            buffer += decoder.decode(value, { stream: true });

            // Save first 3 raw chunks for debugging
            if (debugFirstChunks.length < 3) {
              const rawChunk = decoder.decode(value, { stream: true });
              debugFirstChunks.push({
                chunkNum: chunkCount,
                raw: rawChunk.substring(0, 500),
                bufferLength: buffer.length,
              });
              console.log(`📦 Chunk ${chunkCount}:`, rawChunk.substring(0, 300));
            }

            // Use a smarter JSON parsing approach that handles multi-line objects
            // Extract complete JSON objects regardless of how they're split across lines/chunks
            let jsonStartIdx = 0;
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;

            for (let i = 0; i < buffer.length; i++) {
              const char = buffer[i];

              // Handle string escaping
              if (escapeNext) {
                escapeNext = false;
                continue;
              }

              if (char === "\\") {
                escapeNext = true;
                continue;
              }

              // Track if we're inside a string (JSON strings can contain { or })
              if (char === '"') {
                inString = !inString;
                continue;
              }

              // Only count braces outside of strings
              if (!inString) {
                if (char === "{") braceCount++;
                if (char === "}") braceCount--;

                // When we've closed all braces, we have a complete JSON object
                if (braceCount === 0 && i > jsonStartIdx) {
                  const jsonStr = buffer.substring(jsonStartIdx, i + 1);
                  jsonStartIdx = i + 1;

                  // Skip empty objects and SSE markers
                  const trimmed = jsonStr.trim();
                  if (trimmed === "" || trimmed === "," || trimmed === "[" || trimmed === "]") continue;

                  // Handle SSE format with "data: " prefix
                  let jsonStrToParse = trimmed;
                  if (trimmed.startsWith("data:")) {
                    jsonStrToParse = trimmed.startsWith("data: ")
                      ? trimmed.slice(6)
                      : trimmed.slice(5);
                  }

                  try {
                    const jsonObj = JSON.parse(jsonStrToParse);

                    // Extract text from Gemini format
                    let content = null;

                    // Gemini format: candidates[0].content.parts[0].text
                    if (jsonObj.candidates?.[0]?.content?.parts?.[0]?.text) {
                      content = jsonObj.candidates[0].content.parts[0].text;
                    }
                    // Fallback formats
                    else if (jsonObj.choices?.[0]?.delta?.content) {
                      content = jsonObj.choices[0].delta.content;
                    } else if (jsonObj.choices?.[0]?.message?.content) {
                      content = jsonObj.choices[0].message.content;
                    } else if (jsonObj.content) {
                      content = jsonObj.content;
                    } else if (jsonObj.text) {
                      content = jsonObj.text;
                    }

                    if (content) {
                      totalTokensSent++;
                      res.write(
                        `data: ${JSON.stringify({ type: "token", content })}\n\n`,
                      );

                      if (totalTokensSent === 1) {
                        console.log("✅ First token extracted successfully from Gemini!");
                        console.log("   Content:", content.substring(0, 50));
                      }
                    } else if (chunkCount <= 3) {
                      console.log("📦 Chunk without extractable content:", jsonStrToParse.substring(0, 200));
                    }
                  } catch (e) {
                    if (chunkCount <= 3) {
                      console.warn("⚠️ Failed to parse JSON object:", jsonStrToParse.substring(0, 100));
                    }
                  }
                }
              }
            }

            // Keep unparsed portion of buffer for next iteration
            buffer = buffer.substring(jsonStartIdx);
          }
        } catch (streamError) {
          console.error("❌ Streaming error:", streamError);
          console.error("Total tokens sent before error:", totalTokensSent);
          console.error("Total chunks received before error:", chunkCount);
          res.write(
            `data: ${JSON.stringify({ type: "error", message: streamError.message })}\n\n`,
          );
          res.end();
        }
      } else {
        // Fallback: When streaming is not supported by the environment (e.g. strict Vercel/Netlify functions)
        console.log(
          "⚠️ Streaming not supported by environment, falling back to full JSON response...",
        );

        try {
          // Read the full response from upstream
          const json = await response.json();

          // Extract content based on standard OpenAI format
          let content = "";
          let sources = fetchedSources || [];

          if (json.choices?.[0]?.message?.content) {
            content = json.choices[0].message.content;
          } else if (json.content) {
            content = json.content;
          }

          // Return a standard JSON response that the frontend can handle
          return res.status(200).json({
            content,
            sources,
            publishable: false,
            suggested_followups: [],
          });
        } catch (fallbackError) {
          console.error("❌ Fallback error:", fallbackError);
          return res.status(500).json({
            error: "Failed to process AI response",
            details: fallbackError.message,
          });
        }
      }
    } catch (error) {
      console.error("❌ General handler error:", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Internal Server Error", details: error.message });
      }
    }
  }
