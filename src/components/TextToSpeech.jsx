import {
    Gauge,
    Pause,
    Play,
    RotateCcw,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";
import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";

const TextToSpeech = forwardRef(
  ({ content, title, onClose, hideButton }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [showControls, setShowControls] = useState(false);
    const [isEnglish, setIsEnglish] = useState(false);
    const utteranceRef = useRef(null);
    const intervalRef = useRef(null);
    const chunksRef = useRef([]);
    const currentChunkRef = useRef(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      startSpeech: () => startSpeech(),
      stopSpeech: () => stopSpeech(),
      isPlaying: isPlaying,
    }));

    // Check if content is English
    useEffect(() => {
      if (!content) return;

      // Extract text content (remove HTML tags and code blocks)
      const textContent = content
        .replace(/<pre[^>]*>.*?<\/pre>/gs, " ") // Remove code blocks
        .replace(/<code[^>]*>.*?<\/code>/gs, " ") // Remove inline code
        .replace(/<[^>]*>/g, " ") // Remove all HTML tags
        .replace(/[^\w\s]/g, " ") // Remove special characters
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      // Enhanced English detection
      const commonEnglishWords = [
        "the",
        "is",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "can",
        "may",
        "might",
        "must",
        "shall",
        "this",
        "that",
        "these",
        "those",
        "a",
        "an",
        "and",
        "or",
        "but",
        "if",
        "then",
        "when",
        "where",
        "why",
        "how",
        "what",
        "who",
        "which",
        "with",
        "from",
        "about",
        "into",
        "through",
        "during",
        "before",
        "after",
        "above",
        "below",
        "to",
        "of",
        "in",
        "on",
        "at",
        "by",
        "for",
        "as",
        "it",
        "not",
        "you",
        "we",
        "they",
        "he",
        "she",
        "him",
        "her",
        "their",
        "our",
        "your",
        "my",
        "me",
        "us",
        "them",
        "his",
        "its",
      ];

      const words = textContent
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      const totalWords = words.length;

      if (totalWords < 10) {
        setIsEnglish(false);
        console.log("⚠️ Content too short for language detection");
        return;
      }

      // Count English words
      const englishWordCount = words.filter((word) =>
        commonEnglishWords.includes(word),
      ).length;

      // Check for non-Latin characters (Arabic, Chinese, etc.)
      const nonLatinChars = textContent.match(/[^\u0000-\u007F]/g);
      const hasSignificantNonLatin =
        nonLatinChars && nonLatinChars.length / textContent.length > 0.3;

      // Decision: English if >15% common words AND not significant non-Latin
      const isEnglishContent =
        !hasSignificantNonLatin && englishWordCount / totalWords > 0.15;

      setIsEnglish(isEnglishContent);

      console.log("🌍 Language detection:", {
        totalWords,
        englishWordCount,
        percentage: ((englishWordCount / totalWords) * 100).toFixed(2) + "%",
        hasNonLatin: hasSignificantNonLatin,
        isEnglish: isEnglishContent,
        sample: words.slice(0, 20).join(" "),
      });
    }, [content]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (utteranceRef.current) {
          window.speechSynthesis.cancel();
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);

    const extractText = (html) => {
      // Remove HTML tags first
      const temp = document.createElement("div");
      temp.innerHTML = html;
      let text = temp.textContent || temp.innerText || "";

      // Remove Markdown symbols and formatting
      text = text
        .replace(/#{1,6}\s/g, "") // Remove Markdown headers (#, ##, ###)
        .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold **text**
        .replace(/__(.+?)__/g, "$1") // Remove bold __text__
        .replace(/\*(.+?)\*/g, "$1") // Remove italic *text*
        .replace(/_(.+?)_/g, "$1") // Remove italic _text_
        .replace(/~~(.+?)~~/g, "$1") // Remove strikethrough ~~text~~
        .replace(/`{1,3}[^`]+`{1,3}/g, "") // Remove code blocks ```code```
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links [text](url) -> text
        .replace(/^[\s-]*[-*+]\s/gm, "") // Remove list markers (-, *, +)
        .replace(/^[\s]*\d+\.\s/gm, "") // Remove numbered list (1., 2., etc)
        .replace(/^>\s/gm, "") // Remove blockquote >
        .replace(/[\[\](){}]/g, "") // Remove brackets
        .replace(/[|]/g, ", ") // Replace table pipes with comma
        .replace(/[-=]{3,}/g, "") // Remove horizontal rules ---
        .replace(/[*_~`]/g, "") // Remove remaining symbols
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      console.log("🧹 Cleaned text sample:", text.substring(0, 200));
      return text;
    };

    const startSpeech = () => {
      if (!window.speechSynthesis) {
        toast.error("Text-to-speech is not supported in your browser");
        return;
      }

      // Don't start if already playing
      if (isPlaying) {
        console.log("⚠️ Already playing");
        return;
      }

      try {
        // Only cancel if something is actually speaking
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          console.log("🗑️ Canceling previous speech");
          window.speechSynthesis.cancel();

          // Wait for cancel to complete before starting new speech
          setTimeout(() => {
            startSpeechInternal();
          }, 100);
        } else {
          startSpeechInternal();
        }
      } catch (error) {
        console.error("Failed to start speech:", error);
        toast.error("Failed to start text-to-speech");
      }
    };

    const startSpeechInternal = () => {
      try {
        const text = extractText(content);

        if (!text || text.trim().length === 0) {
          toast.warning("No text content to read");
          return;
        }

        if (text.trim().length < 10) {
          toast.warning("Content too short to read");
          return;
        }

        console.log(`📖 Starting to read ${text.length} characters`);

        // Split text into chunks (for better browser handling)
        const maxLength = 200; // characters per utterance
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let chunks = [];
        let currentChunk = "";

        sentences.forEach((sentence) => {
          if ((currentChunk + sentence).length > maxLength) {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += " " + sentence;
          }
        });

        if (currentChunk.trim()) chunks.push(currentChunk.trim());

        // Filter empty chunks
        chunks = chunks.filter((chunk) => chunk.trim().length > 0);

        if (chunks.length === 0) {
          toast.warning("No valid content to read");
          return;
        }

        // Store chunks and reset index
        chunksRef.current = chunks;
        currentChunkRef.current = 0;

        console.log(`📚 Prepared ${chunks.length} chunks to read`);

        const utterance = new SpeechSynthesisUtterance(chunks[0]);
        utteranceRef.current = utterance;

        // Load voices
        let voices = window.speechSynthesis.getVoices();

        // If voices not loaded yet, wait for them
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            setVoiceAndSpeak();
          };
        } else {
          setVoiceAndSpeak();
        }

        function setVoiceAndSpeak() {
          // Prefer Google voices, then Microsoft, then default
          const englishVoice =
            voices.find(
              (voice) =>
                voice.lang.startsWith("en-") &&
                (voice.name.includes("Google") ||
                  voice.name.includes("Chrome") ||
                  voice.name.includes("Natural")),
            ) ||
            voices.find(
              (voice) =>
                voice.lang.startsWith("en-") &&
                voice.name.includes("Microsoft"),
            ) ||
            voices.find((voice) => voice.lang.startsWith("en-"));

          if (englishVoice) {
            utterance.voice = englishVoice;
            console.log("🔊 Using voice:", englishVoice.name);
          }

          utterance.lang = "en-US";
          utterance.rate = speed;
          utterance.pitch = 1;
          utterance.volume = 1;

          utterance.onstart = () => {
            setIsPlaying(true);
            setIsPaused(false);
            setShowControls(true);

            // Close dropdown menu after speech successfully starts
            if (onClose) {
              setTimeout(() => onClose(), 200);
            }

            // Start progress tracking
            const words = text.split(/\s+/).length;
            const estimatedDuration = (words / (130 * speed)) * 60000; // 130 words per minute
            let elapsed = 0;

            intervalRef.current = setInterval(() => {
              elapsed += 100;
              const progressPercent = Math.min(
                (elapsed / estimatedDuration) * 100,
                100,
              );
              setProgress(progressPercent);

              if (progressPercent >= 100) {
                clearInterval(intervalRef.current);
              }
            }, 100);
          };

          utterance.onend = () => {
            // Check if there are more chunks to read
            currentChunkRef.current++;

            if (currentChunkRef.current < chunksRef.current.length) {
              console.log(
                `📖 Reading chunk ${currentChunkRef.current + 1}/${chunksRef.current.length}`,
              );

              // Read next chunk
              const nextUtterance = new SpeechSynthesisUtterance(
                chunksRef.current[currentChunkRef.current],
              );
              nextUtterance.voice = utterance.voice;
              nextUtterance.lang = "en-US";
              nextUtterance.rate = speed;
              nextUtterance.pitch = 1;
              nextUtterance.volume = 1;
              nextUtterance.onend = utterance.onend; // Recursive call
              nextUtterance.onerror = utterance.onerror;

              utteranceRef.current = nextUtterance;
              window.speechSynthesis.speak(nextUtterance);
            } else {
              // All chunks finished
              console.log("✅ Finished reading all content");
              setIsPlaying(false);
              setIsPaused(false);
              setProgress(100);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }

              // Auto reset after a short delay
              setTimeout(() => {
                setProgress(0);
                setShowControls(false);
              }, 2000);
            }
          };

          utterance.onerror = (event) => {
            // Check error type first to avoid unnecessary console errors
            if (event.error === "interrupted" || event.error === "canceled") {
              console.log(
                "⚠️ Speech interrupted (this is normal)",
                event.error,
              );
              return; // Don't change state for normal interruptions
            }

            // Log real errors only
            console.error("🛑 Speech synthesis error:", event.error, event);

            // Show error toast for real problems
            if (
              event.error === "network" ||
              event.error === "synthesis-failed"
            ) {
              toast.error(`Speech error: ${event.error}`);
            }

            setIsPlaying(false);
            setIsPaused(false);
            setProgress(0);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          };

          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error("Failed to start speech:", error);
        toast.error("Failed to start text-to-speech");
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
      }
    };

    const pauseSpeech = () => {
      try {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          setIsPaused(true);
          console.log("⏸️ Speech paused");
        }
      } catch (error) {
        console.error("Failed to pause:", error);
      }
    };

    const resumeSpeech = () => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
          console.log("▶️ Speech resumed");
        }
      } catch (error) {
        console.error("Failed to resume:", error);
        // If resume fails, try restarting
        restartSpeech();
      }
    };

    const stopSpeech = () => {
      try {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(0);
        setShowControls(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Reset chunk tracking
        currentChunkRef.current = 0;
        chunksRef.current = [];
        console.log("⏹️ Speech stopped");
      } catch (error) {
        console.error("Failed to stop:", error);
      }
    };

    const restartSpeech = () => {
      stopSpeech();
      setTimeout(() => startSpeech(), 100);
    };

    const changeSpeed = (newSpeed) => {
      const wasPlaying = isPlaying && !isPaused;
      const currentChunk = currentChunkRef.current;

      setSpeed(newSpeed);
      console.log(`⚡ Speed changed to ${newSpeed}x`);

      if (wasPlaying) {
        // Stop current playback gracefully
        try {
          window.speechSynthesis.cancel();

          // Small delay to ensure cancel completes
          setTimeout(() => {
            if (chunksRef.current.length > currentChunk) {
              // Continue from current chunk with new speed
              continueFromChunk(currentChunk, newSpeed);
            }
          }, 100);
        } catch (error) {
          console.error("Failed to change speed:", error);
          stopSpeech();
        }
      }
    };

    const continueFromChunk = (chunkIndex, speedRate) => {
      if (chunkIndex >= chunksRef.current.length) {
        console.log("✅ No more chunks to read");
        stopSpeech();
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(
          chunksRef.current[chunkIndex],
        );
        currentChunkRef.current = chunkIndex;

        // Get voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice =
          voices.find(
            (voice) =>
              voice.lang.startsWith("en-") &&
              (voice.name.includes("Google") ||
                voice.name.includes("Chrome") ||
                voice.name.includes("Natural")),
          ) ||
          voices.find(
            (voice) =>
              voice.lang.startsWith("en-") && voice.name.includes("Microsoft"),
          ) ||
          voices.find((voice) => voice.lang.startsWith("en-"));

        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.lang = "en-US";
        utterance.rate = speedRate;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Set handlers
        utterance.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
          setShowControls(true);
        };

        utterance.onend = () => {
          currentChunkRef.current++;

          if (currentChunkRef.current < chunksRef.current.length) {
            console.log(
              `📖 Reading chunk ${currentChunkRef.current + 1}/${chunksRef.current.length}`,
            );
            continueFromChunk(currentChunkRef.current, speedRate);
          } else {
            console.log("✅ Finished reading all content");
            setIsPlaying(false);
            setIsPaused(false);
            setProgress(100);
            setTimeout(() => {
              setProgress(0);
              setShowControls(false);
            }, 2000);
          }
        };

        utterance.onerror = (event) => {
          // Check error type first
          if (event.error === "interrupted" || event.error === "canceled") {
            console.log("⚠️ Speech interrupted (normal behavior)", event.error);
            return; // Don't stop for normal interruptions
          }

          // Log real errors only
          console.error("🛑 Speech error:", event.error);

          if (event.error === "network" || event.error === "synthesis-failed") {
            toast.error(`Speech error: ${event.error}`);
          }

          stopSpeech();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Failed to continue reading:", error);
        stopSpeech();
      }
    };

    // Don't render if not English
    if (!isEnglish) {
      return null;
    }

    const handleListenClick = () => {
      if (!isPlaying) {
        startSpeech();
        // Don't close menu immediately - wait for speech to actually start
        // The onstart handler will close it
      }
    };

    const handleStopFromMenu = () => {
      stopSpeech();
      if (onClose) onClose();
    };

    return (
      <>
        {/* Listen or Stop Button based on playing state - Only if not hidden */}
        {!hideButton &&
          (!isPlaying ? (
            <button
              onClick={handleListenClick}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm flex items-center gap-2 font-medium"
              title="Listen to this guide"
            >
              <Volume2 size={16} />
              Listen to Guide
            </button>
          ) : (
            <button
              onClick={handleStopFromMenu}
              className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors text-sm flex items-center gap-2 font-medium text-red-600"
              title="Stop listening"
            >
              <VolumeX size={16} />
              Stop Listening
            </button>
          ))}

        {/* Floating Controls */}
        {showControls && (
          <div className="fixed bottom-6 right-6 z-50 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-5 w-96 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 border-2 border-black">
                  <Volume2 size={18} className="text-blue-600" />
                </div>
                <div>
                  <span className="font-black text-sm">Audio Player</span>
                  <p className="text-xs text-gray-500">Text-to-Speech</p>
                </div>
              </div>
              <button
                onClick={stopSpeech}
                className="p-1.5 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-gray-200">
              <p
                className="text-xs font-medium text-gray-700 line-clamp-2"
                title={title}
              >
                🎧 {title}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full h-3 bg-gray-200 border-2 border-black overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-600 mt-2">
                <span className="flex items-center gap-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${isPlaying && !isPaused ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                  />
                  {isPlaying && !isPaused
                    ? "Playing"
                    : isPaused
                      ? "Paused"
                      : "Ready"}
                </span>
                <span className="font-bold text-blue-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={restartSpeech}
                className="p-2.5 border-2 border-black hover:bg-gray-100 active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                title="Restart"
              >
                <RotateCcw size={18} />
              </button>

              {isPlaying && !isPaused ? (
                <button
                  onClick={pauseSpeech}
                  className="p-4 border-2 border-black bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  title="Pause"
                >
                  <Pause size={24} />
                </button>
              ) : (
                <button
                  onClick={isPaused ? resumeSpeech : startSpeech}
                  className="p-4 border-2 border-black bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  title={isPaused ? "Resume" : "Play"}
                >
                  <Play size={24} />
                </button>
              )}

              {/* Big Stop Button */}
              <button
                onClick={stopSpeech}
                className="p-4 border-2 border-black bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold"
                title="Stop"
              >
                <VolumeX size={24} />
              </button>
            </div>

            {/* Speed Control */}
            <div className="p-3 bg-gray-50 border-2 border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} className="text-gray-600" />
                <span className="text-xs font-bold text-gray-700">
                  Playback Speed
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`px-2 py-1.5 text-xs font-bold border-2 transition-all active:scale-95 ${
                      speed === s
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white border-gray-300 hover:border-black text-gray-700"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

export default TextToSpeech;
