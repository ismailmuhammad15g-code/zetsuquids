import { Loader, Send } from 'lucide-react';
import { type ChangeEvent, type KeyboardEvent, useCallback, useRef, useState } from 'react';
import { useThinkingStream } from '../../hooks/useThinkingStream';
import { processSSEStream } from '../../lib/streamingUtils';
import { LiveThinkingDisplay } from './LiveThinkingDisplay';

/**
 * ?? Component ?????? - ???? ??? ??????? Live Thinking Stream
 * ???? ????? ??? ??? Hook ???? Component ???? Utility ????
 */
export const AIThinkingDemo = () => {
    const thinkingStream = useThinkingStream();
    const [isLoading, setIsLoading] = useState(false);
    const [userMessage, setUserMessage] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * ????? ??????? - ???? ??????? ??? API ????? ?????? ????
     */
    const handleSendMessage = useCallback(async (message: string) => {
        if (!message.trim() || isLoading) return;

        // ????? ????? ?????? ???????
        thinkingStream.reset();
        setIsLoading(true);
        abortControllerRef.current = new AbortController();

        try {
            // 1?? ????? ????? ??? API
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-exp:free',
                    messages: [{ role: 'user', content: message }],
                    stream: true,
                    // System prompt ?????? - ???? ??? ???? ???????
                    systemPrompt: `??? ????? ???. ??? ???? ??? ???????.
?? ?????? ???? ?????? <thinking> ? </thinking>.
?? ???? ???? ??????? ???? ????????.`,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('Empty response stream');
            }

            // 2?? ?????? ???? ???????? ??? streaming utility
            await processSSEStream(
                response.body,
                (chunk: string) => {
                    // ?? chunk ??? ??????? ?????? useThinkingStream
                    thinkingStream.processChunk(chunk);
                    console.log('?? Chunk received:', chunk);
                },
                (streamError: unknown) => {
                    console.error('? Stream error:', streamError);
                    throw streamError;
                }
            );

            console.log('? Stream complete!');
            console.log('?? Final state:', {
                thinking: thinkingStream.thinkingText,
                response: thinkingStream.finalResponseText,
            });
        } catch (error: unknown) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                console.error('Error:', error);
                // ????? ??? ????? ??? ???????? ???
            }
        } finally {
            setIsLoading(false);
        }

        setUserMessage('');
    }, [thinkingStream, isLoading]);

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            {/* ?? Input Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={userMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setUserMessage(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter' && !isLoading) {
                                handleSendMessage(userMessage);
                            }
                        }}
                        placeholder="???? ??? ??..."
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
                                ????...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                ?????
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ?? Display Area - ??? ??????? ????? */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {isLoading || thinkingStream.finalResponseText || thinkingStream.thinkingText ? (
                    <LiveThinkingDisplay
                        isThinking={thinkingStream.isThinking}
                        thinkingText={thinkingStream.thinkingText}
                        finalResponseText={thinkingStream.finalResponseText}
                    />
                ) : (
                    <p className="text-gray-500 text-center py-8">
                        ???? ?????? ????? ???? ????? ??? ??????? ???????...
                    </p>
                )}
            </div>

            {/* ?? Debug Info - ??????? ??????? (???????) */}
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
