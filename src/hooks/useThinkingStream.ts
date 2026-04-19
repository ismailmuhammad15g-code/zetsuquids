import { useCallback, useState } from "react";

interface ThinkingStreamState {
    fullRawText: string;
    thinkingText: string;
    finalResponseText: string;
    isThinking: boolean;
}

interface UseThinkingStreamOptions {
    onChunk?: (state: ThinkingStreamState) => void;
}

interface UseThinkingStreamReturn extends ThinkingStreamState {
    processChunk: (chunk: string) => void;
    reset: () => void;
}

/**
 * Hook مخصص لمعالجة streaming من AI مع فصل الأفكار عن الرد النهائي
 * يدعم علامات <thinking> و </thinking>
 *
 * @param {Object} options - خيارات الـ hook
 * @param {Function} options.onChunk - callback عند كل chunk جديد
 * @returns {Object} حالة التفكير والنصوص المستخرجة
 */
export const useThinkingStream = (
    options: UseThinkingStreamOptions = {}
): UseThinkingStreamReturn => {
    const { onChunk } = options;

    const [state, setState] = useState<ThinkingStreamState>({
        fullRawText: "",
        thinkingText: "",
        finalResponseText: "",
        isThinking: false,
    });

    /**
     * معالج الـ streaming - يتم استدعاء هذه الدالة لكل chunk جديد من البث
     * @param {string} chunk - النص الجديد القادم من البث
     */
    const processChunk = useCallback((chunk: string): void => {
        setState((prevState: ThinkingStreamState): ThinkingStreamState => {
            // أضف الـ chunk الجديد إلى النص الخام
            const updatedRawText = prevState.fullRawText + chunk;

            // 🔍 تحليل علامات <thinking>
            const thinkingStartIndex = updatedRawText.indexOf("<thinking>");
            const thinkingEndIndex = updatedRawText.indexOf("</thinking>");

            let newThinkingText = prevState.thinkingText;
            let newFinalResponseText = prevState.finalResponseText;
            let newIsThinking = prevState.isThinking;

            // إذا وجدنا علامة البداية ولم نصل إلى النهاية بعد
            if (thinkingStartIndex !== -1 && thinkingEndIndex === -1) {
                // استخرج النص بين <thinking> وموضع البث الحالي
                newThinkingText = updatedRawText.substring(
                    thinkingStartIndex + "<thinking>".length
                );
                newIsThinking = true;
                newFinalResponseText = ""; // لم نصل للرد النهائي بعد
            }
            // إذا وجدنا علامة النهاية
            else if (thinkingStartIndex !== -1 && thinkingEndIndex !== -1) {
                // استخرج النص داخل العلامات بالضبط
                newThinkingText = updatedRawText.substring(
                    thinkingStartIndex + "<thinking>".length,
                    thinkingEndIndex
                );
                newIsThinking = false;

                // استخرج النص بعد علامة الإغلاق
                newFinalResponseText = updatedRawText.substring(
                    thinkingEndIndex + "</thinking>".length
                );
            }
            // إذا لم نجد علامات تفكير على الإطلاق
            else if (thinkingStartIndex === -1 && thinkingEndIndex === -1) {
                newFinalResponseText = updatedRawText;
                newIsThinking = false;
            }

            const newState: ThinkingStreamState = {
                fullRawText: updatedRawText,
                thinkingText: newThinkingText,
                finalResponseText: newFinalResponseText,
                isThinking: newIsThinking,
            };

            // استدعاء callback إذا كان موجوداً
            onChunk?.(newState);

            return newState;
        });
    }, [onChunk]);

    /**
     * إعادة تعيين الحالة
     */
    const reset = useCallback((): void => {
        setState({
            fullRawText: "",
            thinkingText: "",
            finalResponseText: "",
            isThinking: false,
        });
    }, []);

    return {
        ...state,
        processChunk,
        reset,
    };
};
