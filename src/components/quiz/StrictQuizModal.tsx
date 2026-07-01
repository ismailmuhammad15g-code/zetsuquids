"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  points: number;
}

interface StrictQuizModalProps {
  guideId: string | number;
  guideShortName: string;
  onClose: () => void;
  onSuccess: (pointsEarned: number) => void;
}

export const StrictQuizModal: React.FC<StrictQuizModalProps> = ({
  guideId,
  guideShortName,
  onClose,
  onSuccess,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [result, setResult] = useState<{ totalPoints: number; earnedPoints: number; passed: boolean } | null>(null);

  useEffect(() => {
    // Lock scroll on mount
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from("guide_questions")
          .select("id, question_text, options, points") // DO NOT fetch correct_option_index to client for security
          .eq("guide_id", guideId);

        if (error) throw error;
        if (data) {
          setQuestions(data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [guideId]);

  const handleNext = async () => {
    if (selectedOptionIndex === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: selectedOptionIndex };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOptionIndex(null);
    } else {
      // Submit Quiz
      await submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: { [questionId: string]: number }) => {
    setSubmitting(true);
    setError(null);
    try {
      // To calculate points securely, we need to fetch the correct answers on the server (or in this case, a secure client request if no backend)
      // Since we don't have a custom backend route, we'll fetch them here.
      // In a real prod app, an Edge Function should validate the answers.
      const { data: correctData, error: correctError } = await supabase
        .from("guide_questions")
        .select("id, correct_option_index, points")
        .eq("guide_id", guideId);

      if (correctError) throw correctError;

      let earnedPoints = 0;
      let totalPoints = 0;

      correctData?.forEach((q: any) => {
        totalPoints += q.points;
        if (finalAnswers[q.id] === q.correct_option_index) {
          earnedPoints += q.points;
        }
      });

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("You must be logged in to submit a quiz.");
      }

      // Check if already attempted (we can rely on RLS/unique constraint)
      const { error: insertError } = await supabase.from("guide_quiz_attempts").insert({
        user_id: userData.user.id,
        guide_id: guideId,
        total_points_earned: earnedPoints,
      });

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          throw new Error("You have already taken this quiz.");
        }
        throw insertError;
      }

      // Award Points
      if (earnedPoints > 0) {
        await supabase.rpc("award_zpoints", { p_user_email: userData.user.email, p_points: earnedPoints });
      }

      setResult({
        totalPoints,
        earnedPoints,
        passed: earnedPoints > 0, // Could define a pass threshold
      });
      setQuizFinished(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-black mb-4" />
        <h2 className="text-xl font-bold">Loading Quiz...</h2>
      </div>
    );
  }

  if (error && !quizFinished) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Quiz Available</h2>
        <p className="text-gray-600 mb-6">This guide doesn't have any questions set up.</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (quizFinished && result) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg w-full">
          {result.earnedPoints > 0 ? (
            <>
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Quiz Completed!</h2>
              <p className="text-gray-600 mb-6 text-lg">
                You earned <span className="font-bold text-green-600">{result.earnedPoints} Zp</span> out of {result.totalPoints} possible points.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Quiz Completed</h2>
              <p className="text-gray-600 mb-6 text-lg">
                You didn't get any answers correct this time. Keep learning and try again on other guides!
              </p>
            </>
          )}
          <button
            onClick={() => {
              onSuccess(result.earnedPoints);
              onClose();
            }}
            className="w-full px-6 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header matching requested design */}
      <header className="flex items-center px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <span>Guide</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 truncate max-w-[200px] md:max-w-xs">{guideShortName}</span>
        </div>
        <div className="ml-auto font-mono text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
          {currentQuestionIndex + 1} / {questions.length}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
        <div className="max-w-3xl mx-auto flex flex-col h-full">
          
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 mb-4 bg-blue-50 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              {currentQuestion.points} Points available
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
              {currentQuestion.question_text}
            </h1>
          </div>

          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptionIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedOptionIndex(index)}
                  className={`w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-200 group relative overflow-hidden ${
                    isSelected 
                      ? "border-black bg-gray-900 text-white shadow-xl scale-[1.02]" 
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:bg-gray-50 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-semibold text-lg">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-12 flex justify-end">
            <button
              onClick={handleNext}
              disabled={selectedOptionIndex === null || submitting}
              className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all ${
                selectedOptionIndex !== null && !submitting
                  ? "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {currentQuestionIndex === questions.length - 1 ? "Submit Quiz" : "Next Question"}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
