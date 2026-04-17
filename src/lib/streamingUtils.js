/**
 * معالج الـ Streaming - يقرأ البث من API ويطبق معالجة الأفكار
 *
 * @param {ReadableStream} readableStream - البث من response.body
 * @param {Function} onChunk - يتم استدعاؤه لكل chunk بواسطة useThinkingStream
 * @param {Function} onError - معالج الأخطاء
 * @returns {Promise<string>} النص الخام الكامل
 */
export const processSSEStream = async (
    readableStream,
    onChunk,
    onError = null
) => {
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                // تخطي الأسطر الفارغة والـ DONE
                if (!line || line === 'data: [DONE]') continue;

                // معالجة السطر إذا كان يبدأ بـ "data: "
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));

                        // استخرج المحتوى من الـ JSON
                        let content = '';
                        if (data.type === 'token' || data.type === 'content') {
                            content = data.content || '';
                        } else if (data.choices?.[0]?.delta?.content) {
                            // صيغة OpenAI
                            content = data.choices[0].delta.content;
                        }

                        if (content) {
                            fullContent += content;
                            // استدعاء callback لـ useThinkingStream
                            onChunk?.(content);
                        }
                    } catch (parseError) {
                        // تجاهل أخطاء التحليل في الـ chunks الجزئية
                        console.debug('SSE parse error:', parseError.message);
                    }
                }
            }
        }
    } catch (error) {
        onError?.(error);
        throw error;
    } finally {
        reader.releaseLock();
    }

    return fullContent;
};

/**
 * معالج الـ Streaming البديل - ReadableStream العام
 * للاستخدام مع أي مصدر stream عام
 *
 * @param {ReadableStream} readableStream
 * @param {Function} onChunk
 * @param {Function} onError
 * @returns {Promise<string>}
 */
export const processGeneralStream = async (
    readableStream,
    onChunk,
    onError = null
) => {
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;
            onChunk?.(chunk);
        }
    } catch (error) {
        onError?.(error);
        throw error;
    } finally {
        reader.releaseLock();
    }

    return fullContent;
};

/**
 * حساب الرد النهائي بدون علامات التفكير
 * للاستخدام في عرض النص بدون الأفكار
 *
 * @param {string} fullText
 * @returns {string}
 */
export const extractFinalResponse = (fullText) => {
    const thinkingEndIndex = fullText.indexOf('</thinking>');
    if (thinkingEndIndex === -1) {
        // لا توجد علامات تفكير - أرجع النص كما هو
        return fullText;
    }
    // أرجع النص بعد علامة الإغلاق
    return fullText.substring(thinkingEndIndex + '</thinking>'.length).trim();
};

/**
 * استخرج حزم الأفكار فقط
 *
 * @param {string} fullText
 * @returns {string}
 */
export const extractThinkingContent = (fullText) => {
    const thinkingStart = fullText.indexOf('<thinking>');
    const thinkingEnd = fullText.indexOf('</thinking>');

    if (thinkingStart === -1) return '';
    if (thinkingEnd === -1) {
        return fullText.substring(thinkingStart + '<thinking>'.length);
    }

    return fullText.substring(
        thinkingStart + '<thinking>'.length,
        thinkingEnd
    );
};
