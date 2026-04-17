/**
 * 🔧 INTEGRATION SNIPPET - نسخ هذا الكود لتعديل ZetsuGuideAIPage.jsx
 *
 * هذا الملف يوضح بالضبط ماذا تضيف وأين تضيفه
 */

// ─── 1️⃣ أضف هذه Imports في الأعلى ───────────────────────────────────────

import { useThinkingStream } from "../hooks/useThinkingStream";

// ─── 2️⃣ أضف هذا في داخل المكون الرئيسي (في داخل دالة ZetsuGuideAIPage) ───

// إنشاء Hook جديد
const thinkingStream = useThinkingStream();

// ─── 3️⃣ عدّل الـ fetch logic كما يلي ───────────────────────────────────────

// BEFORE: الكود الحالي (حول الـ line 1082)
/*
const response = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "google/gemini-2.0-flash-exp:free",
    messages: messagesPayload,
    userEmail: user?.email,
    userId: user?.id,
    isDeepReasoning,
    isSubAgentMode: isSubAgent,
    skipCreditDeduction: true,
    stream: true,
  }),
});

// ... معالجة الخطأ ...

const contentType = response.headers.get("Content-Type") || "";
const isStreaming = contentType.includes("text/event-stream");

let aiContent = "";

if (isStreaming) {
  console.log("📊 Receiving STREAMING response from AI...");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "token" || data.type === "content") {
            aiContent += data.content;
            setMessages((prev) => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].content = aiContent;
              return newMsgs;
            });
          }
        } catch (e) {}
      }
    }
  }
}
*/

// AFTER: الكود الجديد
/*
const response = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "google/gemini-2.0-flash-exp:free",
    messages: messagesPayload,
    userEmail: user?.email,
    userId: user?.id,
    isDeepReasoning,
    isSubAgentMode: isSubAgent,
    skipCreditDeduction: true,
    stream: true,
    // اختياري: أخبر الـ API أن استخدم التفكير
    useThinking: true,
  }),
});

// ... معالجة الخطأ ...

const contentType = response.headers.get("Content-Type") || "";
const isStreaming = contentType.includes("text/event-stream");

let aiContent = "";

if (isStreaming) {
  console.log("📊 Receiving STREAMING response from AI...");

  // إعادة تعيين حالة التفكير
  thinkingStream.reset();

  // إضافة رسالة فارغة
  setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);

  // 🆕 استخدام processSSEStream مع useThinkingStream
  try {
    await processSSEStream(
      response.body,
      (chunk) => {
        // معالجة الـ chunk عبر Hook التفكير
        thinkingStream.processChunk(chunk);
        aiContent += chunk;

        // تحديث الـ message بالمحتوى الكامل
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = aiContent;
          return newMsgs;
        });
      },
      (error) => {
        console.error("❌ Stream error:", error);
        throw error;
      }
    );
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Stream processing failed:", error);
      throw error;
    }
  }
}
*/

// ─── 4️⃣ عند عرض الرسالة في JSX، استبدل الكود القديم ───────────────────────

// BEFORE: عرض بسيط
/*
<div className="prose prose-sm">
  <ReactMarkdown>
    {message.content}
  </ReactMarkdown>
</div>
*/

// AFTER: عرض مع التفكير
/*
<LiveThinkingDisplay
  isThinking={thinkingStream.isThinking}
  thinkingText={thinkingStream.thinkingText}
  finalResponseText={thinkingStream.finalResponseText || message.content}
/>
*/

// ─── 5️⃣ اختياري: أضف System Prompt للـ API ───────────────────────────────

/*
قل للـ API عند الاتصال:
{
  model: "google/gemini-2.0-flash-exp:free",
  messages: messagesPayload,
  systemPrompt: `أنت مساعد ذكي متقدم. قبل الإجابة:
1. فكر بعمق في السؤال
2. ضع أفكارك داخل <thinking> و </thinking>
3. اكتب الرد النهائي خارج العلامات`,
  useThinking: true,
  // ...باقي البيانات
}
*/

// ─── 📝 ملخص التغييرات المطلوبة ───────────────────────────────────────────

/**
 * 📋 CHECKLIST:
 *
 * 1. ✅ نسخ الملفات:
 *    - src/hooks/useThinkingStream.js
 *    - src/components/ai-elements/LiveThinkingDisplay.jsx
 *    - src/lib/streamingUtils.js
 *
 * 2. ✅ تحديث الـ Imports (في ZetsuGuideAIPage.jsx):
 *    import { useThinkingStream } from "../hooks/useThinkingStream";
 *    import { LiveThinkingDisplay } from "../components/ai-elements/LiveThinkingDisplay";
 *    import { processSSEStream } from "../lib/streamingUtils";
 *
 * 3. ✅ إضافة Hook:
 *    const thinkingStream = useThinkingStream();
 *
 * 4. ✅ تعديل معالجة الـ Streaming:
 *    - استدعاء thinkingStream.reset() في البداية
 *    - استخدام processSSEStream() بدلاً من while loop يدوي
 *    - استدعاء thinkingStream.processChunk(chunk) لكل chunk
 *
 * 5. ✅ تحديث العرض:
 *    - استبدال الـ <ReactMarkdown> بـ <LiveThinkingDisplay>
 *
 * 6. ✅ اختياري: أضف System Prompt أو useThinking flag
 *
 * READY! 🚀
 */
