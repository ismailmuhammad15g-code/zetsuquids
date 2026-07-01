import React from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { FormData, GuideQuestion } from "./types";
import { toast } from "sonner";

interface QuestionsTabProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const QuestionsTab: React.FC<QuestionsTabProps> = ({ formData, setFormData }) => {
  const questions = formData.questions || [];

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error("You can add a maximum of 10 questions.");
      return;
    }
    const newQuestion: GuideQuestion = {
      id: Math.random().toString(36).substring(7),
      question_text: "",
      options: ["", ""], // Start with 2 options
      correct_option_index: 0,
      points: 10, // Default points
    };
    setFormData({ ...formData, questions: [...questions, newQuestion] });
  };

  const removeQuestion = (id: string) => {
    setFormData({
      ...formData,
      questions: questions.filter((q) => q.id !== id),
    });
  };

  const updateQuestion = (id: string, updates: Partial<GuideQuestion>) => {
    setFormData({
      ...formData,
      questions: questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    });
  };

  const addOption = (questionId: string) => {
    const q = questions.find((q) => q.id === questionId);
    if (q && q.options.length < 4) {
      updateQuestion(questionId, { options: [...q.options, ""] });
    } else {
      toast.error("Maximum 4 options allowed.");
    }
  };

  const removeOption = (questionId: string, index: number) => {
    const q = questions.find((q) => q.id === questionId);
    if (q && q.options.length > 2) {
      const newOptions = [...q.options];
      newOptions.splice(index, 1);
      let newCorrectIndex = q.correct_option_index;
      if (newCorrectIndex === index) newCorrectIndex = 0;
      else if (newCorrectIndex > index) newCorrectIndex--;
      updateQuestion(questionId, {
        options: newOptions,
        correct_option_index: newCorrectIndex,
      });
    } else {
      toast.error("Minimum 2 options required.");
    }
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    const q = questions.find((q) => q.id === questionId);
    if (q) {
      const newOptions = [...q.options];
      newOptions[index] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Quiz Questions
          </h2>
          <p className="text-gray-500 text-sm">
            Add up to 10 questions to test your readers. They can earn Zpoints by passing!
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Add some questions to make your guide interactive and help users earn points!
            </p>
            <button
              onClick={addQuestion}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus size={18} />
              Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative group">
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove question"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <h4 className="font-bold text-gray-900">Question {qIndex + 1}</h4>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Question Text</label>
                    <textarea
                      value={q.question_text}
                      onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                      placeholder="e.g. What is the main benefit of..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all resize-y min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">Points to Award</label>
                      <select
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none"
                      >
                        <option value={5}>5 Points</option>
                        <option value={10}>10 Points</option>
                        <option value={15}>15 Points</option>
                        <option value={20}>20 Points (Max)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Answers</label>
                    <div className="space-y-3">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <label className="flex items-center justify-center cursor-pointer shrink-0">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correct_option_index === optIndex}
                              onChange={() => updateQuestion(q.id, { correct_option_index: optIndex })}
                              className="w-5 h-5 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                            />
                          </label>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            className={`flex-1 px-4 py-2 bg-gray-50 border ${
                              q.correct_option_index === optIndex ? "border-green-400 bg-green-50/30" : "border-gray-200"
                            } rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all`}
                          />
                          <button
                            onClick={() => removeOption(q.id, optIndex)}
                            disabled={q.options.length <= 2}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {q.options.length < 4 && (
                      <button
                        onClick={() => addOption(q.id)}
                        className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Option
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Select the radio button next to the correct answer.
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {questions.length < 10 && (
              <button
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:border-gray-400 hover:text-gray-700 transition-all flex items-center justify-center gap-2 bg-white"
              >
                <Plus size={18} />
                Add Another Question ({questions.length}/10)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Quick fix for missing X icon import since I forgot to import it from lucide-react above
import { X } from "lucide-react";
