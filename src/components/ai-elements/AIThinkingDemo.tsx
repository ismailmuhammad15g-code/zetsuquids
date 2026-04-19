// Type definitions for AIThinkingDemo

interface AIThinkingDemoProps {
  // Add prop types here
}

// Event handler types
type HandleEvent = (e: React.SyntheticEvent<any>) => void;

import { Loader, Send } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useThinkingStream } from '../hooks/useThinkingStream';
import { processSSEStream } from '../lib/streamingUtils';
import { LiveThinkingDisplay } from './ai-elements/LiveThinkingDisplay';

/**
 * 🚀 Component متكامل - مثال على استخدام Live Thinking Stream
 * يوضح كيفية دمج الـ Hook والـ Component والـ Utility معاً
 */
export const AIThinkingDemo = () => {
    const thinkingStream = useThinkingStream();
    const [isLoading, setIsLoading] = useState(false);
    const [userMessage, setUserMessage] = useState('');
    const abortControllerRef = useRef(null);

    /**
     * معالج الرسالة - يرسل الرسالة للـ API ويبدأ معالجة البث
     */
    const handleSendMessage = useCallback(async (message) => {
        if (!message.trim() || isLoading) return;

        // إعادة تعيين الحالة السابقة
        thinkingStream.reset();
        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        try {
            // 1️⃣ إرسال الطلب للـ API
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-exp:free',
                    messages: [{ role: 'user', content: message }],
                    stream: true,
                    // System prompt نموذجي - تأكد أنه يطلب التفكير
                    systemPrompt: `أنت مساعد ذكي. فكر بعمق قبل الإجابة.
ضع أفكارك داخل علامات <thinking> و </thinking>.
ثم اكتب الرد النهائي خارج العلامات.`,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            // 2️⃣ معالجة البث باستخدام الـ streaming utility
            await processSSEStream(
                response.body,
                (chunk) => {
                    // كل chunk يتم معالجته بواسطة useThinkingStream
                    thinkingStream.processChunk(chunk);
                    console.log('📨 Chunk received:', chunk);
                },
                (error) => {
                    console.error('❌ Stream error:', error);
                    throw error;
                }
            );

            console.log('✅ Stream complete!');
            console.log('📊 Final state:', {
                thinking: thinkingStream.thinkingText,
                response: thinkingStream.finalResponseText,
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error:', error);
                // يمكنك عرض رسالة خطأ للمستخدم هنا
            }
        } finally {
            setIsLoading(false);
        }

        setUserMessage('');
    }, [thinkingStream, isLoading]);

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* 📝 Input Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                                handleSendMessage(userMessage);
                            }
                        }}
                        placeholder="اسأل شيء ما..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSendMessage(userMessage)}
                        disabled={isLoading || !userMessage.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                جاري...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                إرسال
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 🎯 Display Area - عرض التفكير والرد */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {isLoading || thinkingStream.finalResponseText || thinkingStream.thinkingText ? (
                    <LiveThinkingDisplay
                        isThinking={thinkingStream.isThinking}
                        thinkingText={thinkingStream.thinkingText}
                        finalResponseText={thinkingStream.finalResponseText}
                    />
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        ابدأ بكتابة رسالة لترى كيفية عمل التفكير المباشر...
                    </p>
                )}
            </div>

            {/* 🔍 Debug Info - معلومات التصحيح (اختياري) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-auto max-h-48">
                    <p className="text-yellow-400 mb-2">Debug Info:</p>
                    <p>
                        fullRawText length:{' '}
                        <span className="text-green-400">
                            {thinkingStream.fullRawText.length}
                        </span>
                    </p>
                    <p>
                        isThinking:{' '}
                        <span className="text-cyan-400">
                            {String(thinkingStream.isThinking)}
                        </span>
                    </p>
                    <p>
                        thinkingText length:{' '}
                        <span className="text-purple-400">
                            {thinkingStream.thinkingText.length}
                        </span>
                    </p>
                    <p>
                        finalResponseText length:{' '}
                        <span className="text-orange-400">
                            {thinkingStream.finalResponseText.length}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIThinkingDemo;

