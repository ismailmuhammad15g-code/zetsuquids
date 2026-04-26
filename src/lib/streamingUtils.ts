/**
 * معالج الـ Streaming - يقرأ البث من API ويطبق معالجة الأفكار
 *
 * @param {ReadableStream} readableStream - البث من response.body
 * @param {Function} onChunk - يتم استدعاؤه لكل chunk بواسطة useThinkingStream
 * @param {Function} onError - معالج الأخطاء
 * @returns {Promise<string>} النص الخام الكامل
 */
export const processSSEStream = async (
    readableStream: ReadableStream<Uint8Array>,
    onChunk: ((content: string) => void) | null | undefined,
    onError: ((error: unknown) => void) | null = null
): Promise<string> => {
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
