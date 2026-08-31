"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Save, X, ChevronDown, ChevronUp, 
  GripVertical, FileText, CheckCircle2, Clock, 
  AlertCircle, Target, BookOpen, Layers, Edit
} from "lucide-react";

type Assessment = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  durationMinutes: number;
  passingPercentage: number;
  jobListingId: string | null;
  isActive: boolean;
  _count?: { questions: number };
};

type Job = {
  id: string;
  title: string;
  status: string;
};

type Option = {
  id: string; // temporary for new options, real for saved
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  text: string;
  explanation: string | null;
  points: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string | null;
  options: Option[];
};

export default function AssessmentBuilder() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New assessment form
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    description: "",
    instructions: "",
    durationMinutes: "",
    passingPercentage: "",
    jobListingId: "",
  });

  // Question editing
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState<Question | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const [assessmentsRes, jobsRes] = await Promise.all([
        fetch("/api/employer/assessments"),
        fetch("/api/employer/jobs"),
      ]);
      const [assessmentData, jobsData] = await Promise.all([assessmentsRes.json(), jobsRes.json()]);
      if (!assessmentsRes.ok) throw new Error(assessmentData.error || "Failed to fetch assessments");
      if (!jobsRes.ok) throw new Error(jobsData.error || "Failed to fetch jobs");
      setAssessments(assessmentData.assessments || []);
      setJobs((jobsData.jobs || []).filter((job: Job) => job.status === "ACTIVE" || job.status === "DRAFT"));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchQuestions = async (assessmentId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/employer/assessments/${assessmentId}/questions`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssessment = (a: Assessment) => {
    setSelectedAssessment(a);
    setIsCreatingAssessment(false);
    setEditingQuestionId(null);
    fetchQuestions(a.id);
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newAssessment.jobListingId) throw new Error("Select the job this assessment belongs to.");
      const res = await fetch("/api/employer/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAssessment,
          durationMinutes: Number(newAssessment.durationMinutes),
          passingPercentage: Number(newAssessment.passingPercentage),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create assessment");
      setAssessments([...assessments, data.assessment]);
      setIsCreatingAssessment(false);
      handleSelectAssessment(data.assessment);
      showSuccess("Assessment created successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePublishToggle = async () => {
    if (!selectedAssessment) return;
    try {
      const res = await fetch(`/api/employer/assessments/${selectedAssessment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !selectedAssessment.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update assessment status");
      setSelectedAssessment(data.assessment);
      setAssessments((current) => current.map((assessment) => assessment.id === data.assessment.id ? { ...assessment, ...data.assessment } : assessment));
      showSuccess(data.assessment.isActive ? "Assessment published." : "Assessment returned to draft.");
    } catch (err: any) {
      setError(err.message || "Failed to update assessment status");
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleAddNewQuestion = () => {
    const newQ: Question = {
      id: `temp-${Date.now()}`,
      text: "",
      explanation: "",
      points: 1,
      difficulty: "MEDIUM",
      category: "",
      options: [
        { id: `opt-1-${Date.now()}`, text: "", isCorrect: true },
        { id: `opt-2-${Date.now()}`, text: "", isCorrect: false },
      ],
    };
    setQuestionForm(newQ);
    setEditingQuestionId(newQ.id);
  };

  const handleEditQuestion = (q: Question) => {
    setQuestionForm({ ...q });
    setEditingQuestionId(q.id);
  };

  const handleSaveQuestion = async () => {
    if (!selectedAssessment || !questionForm) return;

    // Validation
    if (!questionForm.text.trim()) {
      setError("Question text is required");
      return;
    }
    if (questionForm.options.length < 2) {
      setError("At least 2 options are required");
      return;
    }
    const hasCorrect = questionForm.options.some(o => o.isCorrect);
    if (!hasCorrect) {
      setError("At least one option must be marked as correct");
      return;
    }

    try {
      const isNew = questionForm.id.startsWith("temp-");
      const url = isNew 
        ? `/api/employer/assessments/${selectedAssessment.id}/questions`
        : `/api/employer/assessments/${selectedAssessment.id}/questions/${questionForm.id}`;
      
      const payload = {
        questionText: questionForm.text,
        explanation: questionForm.explanation || undefined,
        points: questionForm.points,
        difficulty: questionForm.difficulty,
        category: questionForm.category || undefined,
        options: questionForm.options.map(opt => ({
          optionText: opt.text,
          isCorrect: opt.isCorrect
        }))
      };

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save question");
      }
      const data = await res.json();

      const savedQuestion: Question = {
        id: data.question.id,
        text: data.question.questionText,
        explanation: data.question.explanation,
        points: data.question.points,
        difficulty: data.question.difficulty,
        category: data.question.category,
        options: data.question.options.map((opt: any) => ({
          id: opt.id,
          text: opt.optionText,
          isCorrect: opt.isCorrect
        }))
      };

      if (isNew) {
        setQuestions([...questions, savedQuestion]);
      } else {
        setQuestions(questions.map(q => q.id === questionForm.id ? savedQuestion : q));
      }
      
      setEditingQuestionId(null);
      setQuestionForm(null);
      showSuccess("Question saved successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedAssessment) return;
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await fetch(`/api/employer/assessments/${selectedAssessment.id}/questions/${questionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete question");
      
      setQuestions(questions.filter(q => q.id !== questionId));
      showSuccess("Question deleted");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const addOption = () => {
    if (!questionForm) return;
    if (questionForm.options.length >= 6) return;
    
    setQuestionForm({
      ...questionForm,
      options: [
        ...questionForm.options,
        { id: `opt-${Date.now()}`, text: "", isCorrect: false }
      ]
    });
  };

  const updateOption = (id: string, text: string) => {
    if (!questionForm) return;
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.map(o => o.id === id ? { ...o, text } : o)
    });
  };

  const setCorrectOption = (id: string) => {
    if (!questionForm) return;
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.map(o => ({
        ...o,
        isCorrect: o.id === id
      }))
    });
  };

  const removeOption = (id: string) => {
    if (!questionForm) return;
    if (questionForm.options.length <= 2) return;
    
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.filter(o => o.id !== id)
    });
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    if (!selectedAssessment) return;

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    try {
      const res = await fetch(`/api/employer/assessments/${selectedAssessment.id}/questions/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: newQuestions.map((question) => question.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reorder questions");
      setQuestions(newQuestions);
    } catch (err: any) {
      setError(err.message || "Failed to reorder questions");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar: Assessment List */}
      <div className="w-80 border-r border-gray-800 bg-gray-900 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            Assessments
          </h2>
          <button 
            onClick={() => { setIsCreatingAssessment(true); setSelectedAssessment(null); setEditingQuestionId(null); }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            New Assessment
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && !selectedAssessment && (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          )}
          
          {assessments.map(a => (
            <button
              key={a.id}
              onClick={() => handleSelectAssessment(a)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedAssessment?.id === a.id 
                  ? "bg-indigo-600/10 border-indigo-500/50" 
                  : "bg-gray-950 border-gray-800 hover:border-gray-700"
              }`}
            >
              <h3 className="font-semibold text-gray-200 truncate">{a.title}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.durationMinutes}m</span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {a.passingPercentage}% pass</span>
              </div>
            </button>
          ))}
          
          {assessments.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              No assessments found. Create your first one!
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-950 h-screen overflow-y-auto">
        {/* Alerts Overlay */}
        <div className="sticky top-0 z-50 p-4 flex flex-col gap-2 items-center pointer-events-none">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg pointer-events-auto">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <button onClick={() => setError("")} className="ml-4 hover:text-red-400"><X className="h-4 w-4" /></button>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg pointer-events-auto">
              <CheckCircle2 className="h-5 w-5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto w-full p-8 pb-24">
          {/* Create Assessment Form */}
          {isCreatingAssessment && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-4">Create New Assessment</h2>
              <form onSubmit={handleCreateAssessment} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Assessment Title *</label>
                  <input 
                    required
                    type="text" 
                    value={newAssessment.title}
                    onChange={e => setNewAssessment({...newAssessment, title: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Senior Frontend Developer Test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Job *</label>
                  <select
                    required
                    value={newAssessment.jobListingId}
                    onChange={e => setNewAssessment({ ...newAssessment, jobListingId: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a job</option>
                    {jobs.map((job) => <option key={job.id} value={job.id}>{job.title} ({job.status})</option>)}
                  </select>
                  {jobs.length === 0 && <p className="mt-2 text-sm text-amber-300">Create a job before creating an assessment.</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Duration (minutes)</label>
                    <input 
                      type="number" 
                      required min="1" max="180"
                      value={newAssessment.durationMinutes}
                      onChange={e => setNewAssessment({...newAssessment, durationMinutes: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Passing Score (%)</label>
                    <input 
                      type="number" 
                      required min="0" max="100"
                      value={newAssessment.passingPercentage}
                      onChange={e => setNewAssessment({...newAssessment, passingPercentage: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <textarea 
                    value={newAssessment.description}
                    onChange={e => setNewAssessment({...newAssessment, description: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    placeholder="Internal description for recruiters..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Candidate Instructions</label>
                  <textarea 
                    value={newAssessment.instructions}
                    onChange={e => setNewAssessment({...newAssessment, instructions: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                    placeholder="Instructions shown to candidates before they start..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingAssessment(false)}
                    className="px-6 py-2.5 rounded-lg font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Create Assessment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Assessment Editor */}
          {!isCreatingAssessment && selectedAssessment && (
            <div>
              <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-md flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{selectedAssessment.title}</h1>
                  <p className="text-gray-400 mb-4">{selectedAssessment.description || "No description provided."}</p>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1.5 text-sm bg-gray-950 px-3 py-1.5 rounded-md border border-gray-800 text-gray-300">
                      <Clock className="h-4 w-4 text-indigo-400" /> {selectedAssessment.durationMinutes} minutes
                    </span>
                    <span className="flex items-center gap-1.5 text-sm bg-gray-950 px-3 py-1.5 rounded-md border border-gray-800 text-gray-300">
                      <Target className="h-4 w-4 text-emerald-400" /> {selectedAssessment.passingPercentage}% to pass
                    </span>
                    <span className="flex items-center gap-1.5 text-sm bg-gray-950 px-3 py-1.5 rounded-md border border-gray-800 text-gray-300">
                      <Layers className="h-4 w-4 text-blue-400" /> {questions.length} questions
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handlePublishToggle}
                  className={`mr-3 py-2 px-5 rounded-lg transition-colors font-medium whitespace-nowrap ${selectedAssessment.isActive ? "bg-amber-500 hover:bg-amber-400 text-gray-950" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
                >
                  {selectedAssessment.isActive ? "Unpublish" : "Publish"}
                </button>
                <button 
                  onClick={handleAddNewQuestion}
                  disabled={selectedAssessment.isActive}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 text-white py-2 px-5 rounded-lg transition-colors font-medium whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={q.id} className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm group">
                    {/* Reorder controls */}
                    <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveQuestion(index, 'up')} disabled={index === 0} className="p-1 bg-gray-800 rounded hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-gray-800">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => moveQuestion(index, 'down')} disabled={index === questions.length - 1} className="p-1 bg-gray-800 rounded hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-gray-800">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    {editingQuestionId === q.id ? (
                      /* Question Edit Form */
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                          <h3 className="font-bold text-lg text-indigo-400">Edit Question {index + 1}</h3>
                          <button onClick={() => setEditingQuestionId(null)} className="text-gray-400 hover:text-white">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Question Text *</label>
                          <textarea 
                            value={questionForm?.text || ""}
                            onChange={e => questionForm && setQuestionForm({...questionForm, text: e.target.value})}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                            placeholder="Type your question here..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Points</label>
                            <input 
                              type="number" min="1"
                              value={questionForm?.points || 1}
                              onChange={e => questionForm && setQuestionForm({...questionForm, points: parseInt(e.target.value)})}
                              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Difficulty</label>
                            <select 
                              value={questionForm?.difficulty || "MEDIUM"}
                              onChange={e => questionForm && setQuestionForm({...questionForm, difficulty: e.target.value as any})}
                              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="EASY">Easy</option>
                              <option value="MEDIUM">Medium</option>
                              <option value="HARD">Hard</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Category (Optional)</label>
                            <input 
                              type="text" 
                              value={questionForm?.category || ""}
                              onChange={e => questionForm && setQuestionForm({...questionForm, category: e.target.value})}
                              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="e.g. React"
                            />
                          </div>
                        </div>

                        <div className="bg-gray-950/50 p-5 rounded-xl border border-gray-800">
                          <div className="flex justify-between items-center mb-4">
                            <label className="block text-sm font-medium text-gray-300">Answer Options</label>
                            <span className="text-xs text-gray-500">Select the correct answer(s)</span>
                          </div>
                          
                          <div className="space-y-3">
                            {questionForm?.options.map((opt, optIndex) => (
                              <div key={opt.id} className="flex items-center gap-3">
                                <button 
                                  type="button"
                                  onClick={() => setCorrectOption(opt.id)}
                                  className={`h-6 w-6 flex items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors ${
                                    opt.isCorrect ? "bg-emerald-500 border-emerald-500 text-gray-950" : "border-gray-600 hover:border-gray-400"
                                  }`}
                                >
                                  {opt.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                                </button>
                                <input 
                                  type="text"
                                  value={opt.text}
                                  onChange={e => updateOption(opt.id, e.target.value)}
                                  placeholder={`Option ${optIndex + 1}`}
                                  className={`flex-1 bg-gray-950 border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    opt.isCorrect ? "border-emerald-500/50" : "border-gray-800"
                                  }`}
                                />
                                <button 
                                  type="button"
                                  onClick={() => removeOption(opt.id)}
                                  disabled={questionForm.options.length <= 2}
                                  className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-500 p-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          {questionForm && questionForm.options.length < 6 && (
                            <button 
                              type="button"
                              onClick={addOption}
                              className="mt-4 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                              <Plus className="h-4 w-4" /> Add Option
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Explanation (Optional)</label>
                          <textarea 
                            value={questionForm?.explanation || ""}
                            onChange={e => questionForm && setQuestionForm({...questionForm, explanation: e.target.value})}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                            placeholder="Explain why the correct answer is correct..."
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                          <button 
                            type="button"
                            onClick={() => setEditingQuestionId(null)}
                            className="px-5 py-2 rounded-lg font-medium border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button"
                            onClick={handleSaveQuestion}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          >
                            <Save className="h-4 w-4" /> Save Question
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Question Display View */
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-800 text-gray-400 font-bold text-sm">
                              {index + 1}
                            </span>
                            <div>
                              <h3 className="font-medium text-lg leading-relaxed text-gray-200">{q.text}</h3>
                              <div className="flex gap-3 mt-2">
                                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                  {q.difficulty}
                                </span>
                                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                  {q.points} {q.points === 1 ? 'pt' : 'pts'}
                                </span>
                                {q.category && (
                                  <span className="text-xs px-2 py-1 rounded bg-indigo-900/30 text-indigo-400 border border-indigo-800/50">
                                    {q.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditQuestion(q)}
                              className="p-2 text-gray-400 hover:text-indigo-400 bg-gray-950 rounded-lg border border-gray-800 hover:border-indigo-500/50 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-2 text-gray-400 hover:text-red-400 bg-gray-950 rounded-lg border border-gray-800 hover:border-red-500/50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {q.options.map((opt, i) => (
                            <div 
                              key={opt.id} 
                              className={`p-3 rounded-lg border text-sm flex gap-3 ${
                                opt.isCorrect 
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100" 
                                  : "bg-gray-950 border-gray-800 text-gray-400"
                              }`}
                            >
                              <span className={`font-bold ${opt.isCorrect ? "text-emerald-500" : "text-gray-600"}`}>
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {questions.length === 0 && !loading && (
                  <div className="text-center bg-gray-900 border border-gray-800 border-dashed rounded-2xl py-16">
                    <FileText className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No questions yet</h3>
                    <p className="text-gray-500 mb-6">Start building your assessment by adding your first question.</p>
                    <button 
                      onClick={handleAddNewQuestion}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-lg transition-colors font-medium"
                    >
                      <Plus className="h-4 w-4" /> Add First Question
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isCreatingAssessment && !selectedAssessment && !loading && (
            <div className="h-full flex items-center justify-center flex-col text-center opacity-50">
              <BookOpen className="h-24 w-24 text-gray-700 mb-6" />
              <h2 className="text-2xl font-bold text-gray-400 mb-2">Assessment Builder</h2>
              <p className="text-gray-500 max-w-sm">Select an assessment from the sidebar or create a new one to start editing questions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
