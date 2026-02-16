import { useState } from "react";
import { X, Plus, Trash2, CheckCircle2, Circle, HelpCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export default function QuizBuilderModal({ onClose, onInsert }) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [correctAnswer, setCorrectAnswer] = useState(0);
    const [explanation, setExplanation] = useState("");

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length >= 6) {
            toast.error("Maximum 6 options allowed");
            return;
        }
        setOptions([...options, ""]);
    };

    const removeOption = (index) => {
        if (options.length <= 2) {
            toast.error("Minimum 2 options required");
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
        if (correctAnswer >= index && correctAnswer > 0) {
            setCorrectAnswer(correctAnswer - 1);
        }
    };

    const handleSubmit = () => {
        if (!question.trim()) {
            toast.error("Question is required");
            return;
        }
        if (options.some((opt) => !opt.trim())) {
            toast.error("All options must be filled");
            return;
        }

        const quizData = {
            type: "quiz",
            question: question.trim(),
            options: options.map(o => o.trim()),
            answer: correctAnswer,
            explanation: explanation.trim()
        };

        onInsert(quizData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-black text-white px-6 py-4 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <HelpCircle size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Create Interactive Quiz</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {/* Question Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Question
                        </label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is the complexity of binary search?"
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:ring-0 transition-colors text-lg font-medium"
                            autoFocus
                        />
                    </div>

                    {/* Options */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Options (Select the correct answer)
                        </label>
                        <div className="space-y-3">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center gap-3 group">
                                    <button
                                        onClick={() => setCorrectAnswer(index)}
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0",
                                            correctAnswer === index
                                                ? "bg-green-500 border-green-500 text-white shadow-lg scale-110"
                                                : "border-gray-300 text-gray-300 hover:border-gray-400"
                                        )}
                                        title="Mark as correct answer"
                                    >
                                        {correctAnswer === index ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                    </button>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className={cn(
                                            "flex-1 px-4 py-3 rounded-xl border-2 focus:ring-0 transition-colors",
                                            correctAnswer === index
                                                ? "border-green-500 bg-green-50 focus:border-green-600"
                                                : "border-gray-200 focus:border-black"
                                        )}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            onClick={() => removeOption(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove option"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addOption}
                            className="mt-3 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                            <Plus size={16} />
                            Add Option
                        </button>
                    </div>

                    {/* Explanation (Optional) */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Explanation (Optional)
                        </label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            placeholder="Why is this the correct answer? Shown after submission."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:ring-0 transition-colors min-h-[100px]"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 hover:scale-[1.02] transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Insert Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}
