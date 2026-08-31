"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, ShieldAlert, XCircle, LayoutGrid } from "lucide-react";

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  points: number;
  options: Option[];
};

type StartResponse = {
  success: boolean;
  attemptId: string;
  assessment: {
    title: string;
    durationMinutes: number;
  };
  startedAt: string;
  questions: Array<{
    id: string;
    questionText: string;
    points: number;
    options: Array<{ id: string; optionText: string }>;
  }>;
  error?: string;
};

type SubmitResponse = {
  success: boolean;
  results: {
    score: number; // percentage
    correctCount: number;
    incorrectCount: number;
    passed: boolean;
  };
  error?: string;
};

export default function ActiveMCQAssessment() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assessmentId = searchParams?.get("id");

  const [status, setStatus] = useState<"starting" | "active" | "submitting" | "results" | "error">("starting");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [attemptId, setAttemptId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentDetails, setAssessmentDetails] = useState<{ title: string; duration: number } | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [results, setResults] = useState<SubmitResponse["results"] | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setStatus("error");
      setErrorMessage("No assessment ID provided.");
      return;
    }
    
    const startAssessment = async () => {
      try {
        const res = await fetch("/api/assessment/mcq/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId }),
        });
        
        const data: StartResponse = await res.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to start assessment");
        }
        
        setAttemptId(data.attemptId);
        setAssessmentDetails({
          title: data.assessment.title,
          duration: data.assessment.durationMinutes,
        });
        setQuestions(data.questions.map(q => ({
          id: q.id,
          text: q.questionText,
          points: q.points,
          options: q.options.map(opt => ({
            id: opt.id,
            text: opt.optionText
          }))
        })));
        const elapsedSeconds = Math.floor(
          Math.max(0, Date.now() - new Date(data.startedAt).getTime()) / 1000,
        );
        setTimeLeft(Math.max(0, data.assessment.durationMinutes * 60 - elapsedSeconds));
        setStatus("active");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    };

    startAssessment();
  }, [assessmentId]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (status !== "active") return;
    setStatus("submitting");
    if (timerRef.current) clearTimeout(timerRef.current);
    
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId,
      selectedOptionId,
    }));

    try {
      const res = await fetch("/api/assessment/mcq/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: formattedAnswers }),
      });
      
      const data: SubmitResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to submit assessment");
      }
      
      setResults(data.results);
      setStatus("results");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to submit. Please contact support.");
    }
  };

  useEffect(() => {
    if (status === "active" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (status === "active" && timeLeft === 0) {
      // Auto-submit
      handleSubmit();
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "starting") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium">Preparing your assessment...</p>
        </div>
      </div>
    );
  }

  if (status === "submitting") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium">Submitting your answers...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="max-w-md rounded-xl bg-gray-900 p-8 text-center border border-gray-800">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold">Error</h2>
          <p className="mb-6 text-gray-400">{errorMessage}</p>
          <button 
            onClick={() => router.push("/assessment/mcq")}
            className="w-full rounded-md bg-indigo-600 py-2 font-medium hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === "results" && results) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100 p-6">
        <div className="max-w-lg w-full rounded-2xl bg-gray-900 p-8 border border-gray-800 shadow-xl">
          <div className="text-center mb-8">
            {results.passed ? (
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
            ) : (
              <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            )}
            <h1 className="text-3xl font-bold mb-2">Assessment Complete</h1>
            <p className="text-gray-400">
              {results.passed ? "Congratulations! You passed the assessment." : "You did not meet the passing score this time."}
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-gray-950 rounded-lg border border-gray-800">
              <span className="text-gray-400">Final Score</span>
              <span className="text-2xl font-bold">{results.score}%</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-950 rounded-lg border border-gray-800">
              <span className="text-gray-400">Correct Answers</span>
              <span className="text-emerald-500 font-medium">{results.correctCount}</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-950 rounded-lg border border-gray-800">
              <span className="text-gray-400">Incorrect Answers</span>
              <span className="text-red-500 font-medium">{results.incorrectCount}</span>
            </div>
          </div>
          
          <button 
            onClick={() => router.push("/assessment/mcq")}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-xs">{assessmentDetails?.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-1.5 border border-gray-800">
            <Clock className={`h-4 w-4 ${timeLeft < 60 ? 'text-red-500' : 'text-gray-400'}`} />
            <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-200'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <button 
            onClick={handleSubmit}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-900">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </span>
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-medium leading-relaxed sm:text-2xl">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center rounded-xl border p-5 transition-all ${
                    answers[currentQuestion.id] === option.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-600 mr-4">
                    {answers[currentQuestion.id] === option.id && (
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.id}
                    checked={answers[currentQuestion.id] === option.id}
                    onChange={() => handleOptionSelect(currentQuestion.id, option.id)}
                    className="sr-only"
                  />
                  <span className="text-base text-gray-200">{option.text}</span>
                </label>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-gray-800 pt-6">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-5 py-2.5 font-medium text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Complete Assessment
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="hidden w-80 flex-col border-l border-gray-800 bg-gray-950 lg:flex overflow-y-auto">
          <div className="p-6 border-b border-gray-800 bg-indigo-500/5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-indigo-400 mb-1">Proctoring Active</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your session is being monitored. Do not switch tabs or exit fullscreen mode during the assessment.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-300">
              <LayoutGrid className="h-4 w-4" />
              Question Navigator
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentQuestionIndex === idx;
                
                let btnClass = "flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ";
                
                if (isCurrent) {
                  btnClass += "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-950 bg-gray-800 text-white";
                } else if (isAnswered) {
                  btnClass += "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30";
                } else {
                  btnClass += "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800";
                }
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-indigo-600/20 border border-indigo-500/30"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-gray-900 border border-gray-800"></div>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-gray-800 ring-1 ring-indigo-500 ring-offset-1 ring-offset-gray-950"></div>
                <span>Current</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
