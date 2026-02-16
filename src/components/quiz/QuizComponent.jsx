import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, X, Trophy, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export default function QuizComponent({ data }) {
    // Graceful fallback for invalid data
    if (!data || !data.question || !Array.isArray(data.options)) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle size={20} />
                <span>Invalid Quiz Data</span>
            </div>
        );
    }

    const { question, options, answer, explanation } = data;
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const isCorrect = selected === answer;

    const handleSubmit = () => {
        if (selected === null) return;
        setSubmitted(true);

        if (selected === answer) {
            // Confetti Explosion!
            const duration = 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                });
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                });
            }, 250);
        }
    };

    return (
        <div className="not-prose my-10 w-full max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
                {/* Header */}
                <div className="bg-black text-white px-8 py-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10" />
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                            <HelpCircle className="text-white" size={24} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black leading-tight">
                            {question}
                        </h3>
                    </div>
                </div>

                {/* Options */}
                <div className="p-8 space-y-4">
                    <div className="grid gap-3">
                        {options.map((option, index) => {
                            const isSelected = selected === index;
                            const isAnswer = answer === index;

                            // Determine state styles
                            let stateStyles = "border-gray-200 hover:border-black hover:bg-gray-50";
                            if (submitted) {
                                if (isAnswer) stateStyles = "border-green-500 bg-green-50 text-green-700";
                                else if (isSelected && !isCorrect) stateStyles = "border-red-500 bg-red-50 text-red-700";
                                else stateStyles = "border-gray-100 opacity-50";
                            } else if (isSelected) {
                                stateStyles = "border-black bg-black text-white shadow-lg transform scale-[1.02]";
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => !submitted && setSelected(index)}
                                    disabled={submitted}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group relative",
                                        stateStyles
                                    )}
                                >
                                    <span className="font-semibold text-lg">{option}</span>

                                    {submitted && isAnswer && (
                                        <span className="bg-green-500 text-white p-1 rounded-full animate-in zoom-in">
                                            <Check size={16} strokeWidth={3} />
                                        </span>
                                    )}
                                    {submitted && isSelected && !isCorrect && (
                                        <span className="bg-red-500 text-white p-1 rounded-full animate-in zoom-in">
                                            <X size={16} strokeWidth={3} />
                                        </span>
                                    )}
                                    {!submitted && isSelected && (
                                        <span className="w-3 h-3 bg-white rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {!submitted ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-4"
                            >
                                <button
                                    onClick={handleSubmit}
                                    disabled={selected === null}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                                >
                                    Check Answer
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "mt-6 p-6 rounded-xl border-2",
                                    isCorrect
                                        ? "bg-green-50 border-green-200"
                                        : "bg-red-50 border-red-200"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white text-2xl shadow-sm",
                                        isCorrect ? "bg-green-500" : "bg-red-500"
                                    )}>
                                        {isCorrect ? "🎉" : "😢"}
                                    </div>
                                    <div>
                                        <h4 className={cn(
                                            "font-black text-xl mb-1",
                                            isCorrect ? "text-green-800" : "text-red-800"
                                        )}>
                                            {isCorrect ? "Correct!" : "Incorrect"}
                                        </h4>
                                        <p className={cn(
                                            "text-lg",
                                            isCorrect ? "text-green-700" : "text-red-700"
                                        )}>
                                            {explanation || (isCorrect ? "Great job! You nailed it." : "Don't worry, try again next time!")}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
