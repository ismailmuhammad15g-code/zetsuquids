import { CheckCircle, Globe, Languages, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { extractGuideContent } from "../lib/utils";
import { supabase } from "../lib/api";

const LANGUAGES = [
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

export function GuideTranslator({ guide, isOpen, onClose }) {
  const { user } = useAuth();
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!selectedLanguage) {
      toast.error("Please select a target language");
      return;
    }

    setIsLoading(true);
    setTranslation("");

    try {
      const targetLang = LANGUAGES.find((l) => l.code === selectedLanguage);

      // Use AI for translation - more reliable and complete
      const fullText = `# ${guide.title}\n\n${extractGuideContent(guide)}`;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          model: "glm-4.5-air:free",
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the following text to ${targetLang.name} (language code: ${selectedLanguage}).

IMPORTANT RULES:
- Maintain all markdown formatting (# headers, ## subheaders, etc.)
- Keep all markdown syntax intact
- Preserve line breaks and structure
- Use proper ${targetLang.name} grammar and natural language
- For Arabic (ar): Use proper Arabic script, right-to-left text
- Output ONLY the translated text, nothing else

Text to translate:`,
            },
            {
              role: "user",
              content: fullText,
            },
          ],
          skipCreditDeduction: true, // Free translation
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      const translatedText =
        data.choices?.[0]?.message?.content || "Translation failed";

      setTranslation(translatedText);

      // Log usage (free, no credits)
      if (user) {
        await supabase.from("usage_logs").insert({
          user_email: user.email.toLowerCase(),
          action: "Guide Translation (Free)",
          details: `Translated "${guide.title}" to ${targetLang.name}`,
          credits_used: 0,
        });
      }

      toast.success(`Successfully translated to ${targetLang.name}! 🎉`);
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Translation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[99998]" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[99999] flex flex-col bg-white"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
        }}
      >
        {/* Header */}
        <div className="bg-white border-b-4 border-black p-6 pt-20 flex-shrink-0">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black flex items-center justify-center">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-black">
                  Guide Translator
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  {guide.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 bg-black hover:bg-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {!translation ? (
              <div className="max-w-3xl mx-auto">
                {/* Language Selector */}
                <div className="bg-white border-4 border-black p-6 mb-6">
                  <label className="block text-lg font-black text-black mb-4">
                    Select Language
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={`p-3 border-3 border-black transition-all ${selectedLanguage === lang.code
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-100"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-bold text-sm">{lang.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Translate Button */}
                <button
                  onClick={handleTranslate}
                  disabled={isLoading || !selectedLanguage}
                  className="w-full px-8 py-5 bg-black text-white border-4 border-black font-black text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Globe className="w-6 h-6" />
                      Translate FREE
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4 font-medium">
                  ✨ Free translation • Auto-detect language • No credits
                  required
                </p>
              </div>
            ) : (
              <div className="bg-white border-4 border-black p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-black">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-black text-black">
                      Translation Complete
                    </h3>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(translation);
                        toast.success("Copied!");
                      }}
                      className="px-5 py-2.5 bg-black text-white border-3 border-black font-bold hover:bg-gray-800 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        setTranslation("");
                        setSelectedLanguage("");
                      }}
                      className="px-5 py-2.5 bg-white text-black border-3 border-black font-bold hover:bg-gray-100 transition-colors"
                    >
                      New
                    </button>
                  </div>
                </div>
                <div className="prose prose-lg max-w-none">
                  <div
                    className="whitespace-pre-wrap text-gray-800 leading-relaxed font-medium"
                    dir={
                      selectedLanguage === "ar" || selectedLanguage === "he"
                        ? "rtl"
                        : "ltr"
                    }
                    style={{
                      textAlign:
                        selectedLanguage === "ar" || selectedLanguage === "he"
                          ? "right"
                          : "left",
                    }}
                  >
                    {translation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
