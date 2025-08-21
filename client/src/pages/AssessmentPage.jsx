import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentScreen from "../components/learning/AssessmentScreen";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useSSEProgress } from "../hooks/useSSEProgress";
import {
  learningPaths,
  aiAssistant,
  assessmentQuestions,
  saveAssessmentAnswers,
} from "../services/aiLearningService";
import { useAuthStore } from "../store/authStore";

/**
 * Assessment options mapping (must match backend order exactly!)
 * Each array represents the options for a question, in ascending order of value/level.
 * The index of the selected option is sent to the backend.
 *
 * IMPORTANT: If you change the order or content here, update the backend's assessmentOptions too.
 */
// Use the value field for answer mapping, and label for display.
// Consistency options are now in ascending order of commitment.
const assessmentOptions = [
  ["fast_overview", "step_by_step", "hands_on", "theory_first"],
  ["structured", "flexible", "interactive", "guided"],
  ["beginner", "intermediate", "advanced", "expert"],
  ["need_support", "somewhat", "comfortable", "very_comfortable"],
  ["1_hour", "2_hours", "4_hours", "6_plus"],
  ["flexible", "somewhat_consistent", "mostly_consistent", "very_consistent"],
  ["personal_interest", "promotion", "skill_upgrade", "career_change"],
];
console.log("[AssessmentPage] assessmentOptions:", assessmentOptions);
console.log("[AssessmentPage] assessmentOptions length:", assessmentOptions.length);
assessmentOptions.forEach((opts, idx) => console.log(`[AssessmentPage] assessmentOptions[${idx}] length:`, opts.length));
const AssessmentPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  // Remove createGoal and isGeneratingTasks from useGoalStore

  // --- SSE Progress for Roadmap and Task Generation ---
  const [roadmapSseUrl, setRoadmapSseUrl] = useState(null);
  const [tasksSseUrl, setTasksSseUrl] = useState(null);

  // Roadmap SSE
  useEffect(() => {
    if (roadmapSseUrl) {
      roadmapSse.start();
    }
  }, [roadmapSseUrl]);

  const roadmapSse = useSSEProgress(roadmapSseUrl, async (data) => {
    if (data.roadmap && data.goalId) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:5000/api/goals/${data.goalId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Goal not found");
        const result = await response.json();
        const found = result.data;
        setGoalData(found);
        let roadmapObj = found.roadmap;
        if (typeof roadmapObj === "string") {
          try {
            roadmapObj = JSON.parse(roadmapObj);
          } catch {}
        }
        setRoadmap(roadmapObj);
        setCurrentStep("roadmap");
      } catch (err) {
        alert("Failed to fetch roadmap from database. Please try again.");
        setCurrentStep("goalSetup");
      }
    } else {
      alert("Failed to generate roadmap. Please try again.");
      setCurrentStep("goalSetup");
    }
    // Always reset roadmapSseUrl after completion to prevent re-trigger
    setRoadmapSseUrl(null);
  });

  // Tasks SSE
  useEffect(() => {
    if (tasksSseUrl) {
      tasksSse.start();
    }
  }, [tasksSseUrl]);

  const tasksSse = useSSEProgress(tasksSseUrl, async (data) => {
    setIsTaskGenerationLoading(false);
    console.log('[AssessmentPage] SSE data received:', data);
    if (data.tasks || data.tasksGenerated > 0) {
      setAiProgress({ stage: 'Complete! Redirecting to your tasks...', progress: 100 });
      // Fetch goals to update the store so the new goal appears immediately
      try {
        const goalStore = await import("../store/goalStore.js");
        if (goalStore && goalStore.useGoalStore) {
          console.log('[AssessmentPage] Fetching goals after task generation...');
          const store = goalStore.useGoalStore.getState();
          await store.fetchGoals();
          const { goals, setActiveGoal } = goalStore.useGoalStore.getState();
          console.log('[AssessmentPage] Goals in store after fetch:', goals);
          // If backend returned goalId, set it as active
          if (data.goalId) {
            setActiveGoal(data.goalId);
          } else if (goals && goals.length > 0) {
            const mostRecentGoal = goals.reduce((latest, current) => {
              const latestDate = new Date(latest.createdAt || latest._id);
              const currentDate = new Date(current.createdAt || current._id);
              return currentDate > latestDate ? current : latest;
            });
            if (mostRecentGoal?._id) setActiveGoal(mostRecentGoal._id);
          }
        }
      } catch (err) {
        console.warn("[AssessmentPage] Could not refresh goals after task generation:", err);
      }
      setTimeout(() => {
        navigate("/tasks");
      }, 1000);
    } else if (data.error) {
      setGoalCreationError(data.error || "AI streaming error");
    }
    // Always reset tasksSseUrl after completion to prevent re-trigger
    setTasksSseUrl(null);
  });

  // Mirror SSE task progress into the page progress bar
  useEffect(() => {
    if (tasksSse?.progress?.stage) {
      setAiProgress({
        stage: tasksSse.progress.stage,
        progress: tasksSse.progress.percent || 0,
      });
    }
  }, [tasksSse?.progress?.stage, tasksSse?.progress?.percent]);

  // Remove all localStorage cleanup logic for roadmap/goal
  const [currentStep, setCurrentStep] = useState("pathSelection"); // pathSelection, assessment, goalSetup, roadmap
  const [selectedPath, setSelectedPath] = useState("");
  // userProfile state fully removed
  const [goalData, setGoalData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [goalCreationError, setGoalCreationError] = useState(null);
  const [aiProgress, setAiProgress] = useState({ stage: '', progress: 0 });
  const [personalNeeds, setPersonalNeeds] = useState("");
  // Local loading state for task generation
  const [isTaskGenerationLoading, setIsTaskGenerationLoading] = useState(false);

  // Top-level state in AssessmentPage
  const [timeframe, setTimeframe] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [motivation, setMotivation] = useState("");

  // Load saved data from localStorage on component mount
  useEffect(() => {
    // Check if this is a fresh goal creation (user clicked "Create New Goal")
    const isNewGoalCreation = new URLSearchParams(window.location.search).get('new') === 'true';

    if (isNewGoalCreation) {
      // Clear any existing assessment data for fresh start
      localStorage.removeItem("aiLearning_goalData");
      localStorage.removeItem("aiLearning_roadmap");
      localStorage.removeItem("aiLearning_currentStep");
      localStorage.removeItem("aiLearning_assessmentResponses");
      localStorage.removeItem("aiLearning_assessmentData");
      localStorage.removeItem("aiLearning_learningData");
      localStorage.removeItem("aiLearning_selectedPath");

      // Start fresh with path selection
      setCurrentStep("pathSelection");
      setGoalData(null);
      setRoadmap(null);
      return;
    }

    const savedGoalData = localStorage.getItem("aiLearning_goalData");
    const savedRoadmap = localStorage.getItem("aiLearning_roadmap");
    const savedLearningData = localStorage.getItem("aiLearning_learningData");
    const savedStep = localStorage.getItem("aiLearning_currentStep");
    const savedSelectedPath = localStorage.getItem("aiLearning_selectedPath");

    // Only redirect to learning dashboard if user is not creating a new goal
    // and has complete learning setup
    if (savedGoalData && savedRoadmap && savedLearningData) {
      navigate("/learning-dashboard");
      return;
    }

    // Load saved progress for incomplete goal creation
    if (savedSelectedPath) {
      setSelectedPath(savedSelectedPath);
    }
    if (savedGoalData) {
      setGoalData(JSON.parse(savedGoalData));
    }
    if (savedRoadmap) {
      setRoadmap(JSON.parse(savedRoadmap));
    }
    if (savedStep) {
      setCurrentStep(savedStep);
    }
  }, [navigate]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Check if user has existing incomplete assessment data
  const hasIncompleteData = () => {
  // userProfile removed
  const savedProfile = null;
    const savedGoalData = localStorage.getItem("aiLearning_goalData");
    const savedRoadmap = localStorage.getItem("aiLearning_roadmap");
    const savedLearningData = localStorage.getItem("aiLearning_learningData");

    // Has some data but not complete
    return (savedProfile || savedGoalData || savedRoadmap) && !savedLearningData;
  };

  // Show option to continue or start fresh if user has incomplete data
  const showContinueOption = hasIncompleteData() && !new URLSearchParams(window.location.search).get('new');

  if (showContinueOption) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl">
            <CardContent className="p-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-6">
                Continue Previous Assessment?
              </h1>
              <p className="text-gray-300 mb-8">
                We found an incomplete assessment. Would you like to continue where you left off or start fresh?
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => {
                    // Continue with existing data
                    const savedStep = localStorage.getItem("aiLearning_currentStep");
                    if (savedStep) {
                      setCurrentStep(savedStep);
                    } else {
                      setCurrentStep("assessment");
                    }
                  }}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Continue Previous Assessment
                </Button>

                <Button
                  onClick={() => {
                    // Start fresh
                    // userProfile localStorage fully removed
                    localStorage.removeItem("aiLearning_goalData");
                    localStorage.removeItem("aiLearning_roadmap");
                    localStorage.removeItem("aiLearning_currentStep");
                    localStorage.removeItem("aiLearning_assessmentResponses");
                    localStorage.removeItem("aiLearning_assessmentData");
                    localStorage.removeItem("aiLearning_selectedPath");

                    setCurrentStep("pathSelection");
                    setSelectedPath("");
                    // setUserProfile fully removed
                    setGoalData(null);
                    setRoadmap(null);
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Start Fresh Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handlePathSelection = (pathId) => {
    setSelectedPath(pathId);
    localStorage.setItem("aiLearning_selectedPath", pathId);
    localStorage.setItem("aiLearning_currentStep", "assessment");
    setCurrentStep("assessment");
  };

  // Store assessment answers in a variable and pass to backend
  // Initialize all answers to -1 (unanswered)
  const [assessmentAnswers, setAssessmentAnswers] = useState(Array(assessmentOptions.length).fill(-1));
  /**
   * Handles completion of the assessment step.
   * Maps each selected option to its index (ascending order, as per assessmentOptions).
   * Validates that all indices are within range.
   */
  const handleAssessmentComplete = async (responses) => {
    console.log("[AssessmentPage] handleAssessmentComplete responses:", responses);
    // Robust validation: ensure all questions are answered
    if (!responses || responses.length !== assessmentOptions.length) {
      console.error("[AssessmentPage] Assessment incomplete: responses.length=", responses?.length, "expected=", assessmentOptions.length);
      alert("Assessment is incomplete. Please answer all questions before continuing.");
      return;
    }
    // Map responses to indices using value, not label
    const answers = responses.map((r, idx) => {
      const questionOptions = assessmentOptions[idx];
      const answerIdx = questionOptions.findIndex(opt => opt === r.value);
      if (answerIdx === -1) {
        console.error(`[AssessmentPage] Invalid answer: '${r.value}' not found in options for question ${idx + 1}`);
        alert(`Invalid answer: '${r.value}' not found in options for question ${idx + 1}`);
        throw new Error(`Invalid answer: '${r.value}' not found in options for question ${idx + 1}`);
      }
      return answerIdx;
    });
    console.log("[AssessmentPage] Computed answer indices:", answers);
    // Validation: Ensure all indices are valid
    if (answers.some(idx => typeof idx !== "number" || idx < 0)) {
      console.error("[AssessmentPage] Invalid indices in answers:", answers);
      alert("Assessment contains invalid answers. Please review your selections.");
      return;
    }
    setAssessmentAnswers(answers);
    // Always pass personalNeeds to backend as personalize
    const personalize = personalNeeds || "";
    const path = selectedPath || "";
    // Persist all assessment data as a single object (duration will be set in goalSetup step)
    const assessmentData = {
    answers,
    personalize, // Always set from personalNeeds
    path,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("aiLearning_assessmentData", JSON.stringify(assessmentData));
  setCurrentStep("goalSetup");
  };

  const getSseUrl = (relativeUrl) => {
    // Always use full backend URL for SSE in dev
    if (import.meta.env.DEV) {
      // If already absolute, return as is
      if (relativeUrl.startsWith('http')) return relativeUrl;
      return `http://localhost:5000${relativeUrl}`;
    }
    return relativeUrl;
  };

  const handleGoalSetupComplete = async (goals) => {
    setGoalData(goals);
    // Validate months (duration) here
    let months = goals?.months || goals?.timeframe;
    months = Number(months);
    if (!months || isNaN(months) || months < 1) {
      alert("Please select a valid learning duration (months) before continuing.");
      setCurrentStep("goalSetup");
      return;
    }
    setCurrentStep("generatingRoadmap");
    // Frontend validation for assessmentAnswers only
    const requiredIndices = [2, 4, 5];
    const missingAnswers = requiredIndices.filter(idx => typeof assessmentAnswers[idx] !== "number" || isNaN(assessmentAnswers[idx]) || assessmentAnswers[idx] === -1);
    const missingFields = [];
    if (missingAnswers.length > 0) missingFields.push('answers');
    if (!goals?.learningPath && !selectedPath) missingFields.push('learningPath');
    if (!months) missingFields.push('months');
    if (missingFields.length > 0) {
      console.error('[AssessmentPage] Missing or undefined fields:', missingFields, { assessmentAnswers, goals });
      alert('Assessment is incomplete or invalid. Please ensure all required fields are filled before continuing.\nMissing: ' + missingFields.join(', '));
      setCurrentStep("goalSetup");
      return;
    }
    // Save assessment answers as before
    try {
      const assessmentData = JSON.parse(localStorage.getItem("aiLearning_assessmentData") || "{}");
      const token = localStorage.getItem("token");
      if (user && user._id) {
        assessmentData.userId = user._id;
      }
      await saveAssessmentAnswers({
        answers: assessmentAnswers,
        personalize: goals.personalize || "",
        duration: months,
        path: goals.learningPath || selectedPath || "",
        token,
        userId: user && user._id ? user._id : undefined,
      });
    } catch (error) {
      console.error("[AssessmentPage] Error saving assessment answers:", error);
      alert("Failed to save assessment answers. Please try again.");
      setCurrentStep("goalSetup");
      return;
    }
    // Now trigger roadmap generation via SSE
    // Build context and query string
    const context = {
      answers: assessmentAnswers,
      personalize: goals.personalize || personalNeeds || "",
      duration: months,
      path: goals.learningPath || selectedPath || "",
      userId: user?._id || user?.id || "",
    };
    const params = new URLSearchParams();
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === "object") {
        params.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
  setRoadmap(null);
  setAiProgress({ stage: "", progress: 0 });
  // Set up SSE for roadmap generation
  const sseUrl = getSseUrl(`/api/ai/roadmap/stream?${params.toString()}`);
  setRoadmapSseUrl(sseUrl);
  // setRoadmapSseActive removed (no longer needed)
  setCurrentStep("generatingRoadmap");
  };

  const handleStartLearning = async () => {
    setGoalCreationError(null);
    setIsTaskGenerationLoading(true);
    const userId = user?._id || user?.id || "";
    const goalId = goalData?._id || "";
  // Prefer SSE per-phase endpoint for reliability
  const params = new URLSearchParams({ userId, goalId });
  const sseUrl = getSseUrl(`/api/ai/tasks/stream-phases?${params.toString()}`);
  setTasksSseUrl(sseUrl);
  };

  // --- Per-Phase Progress UI ---
  const PerPhaseProgress = ({ sseProgress, roadmap }) => {
    // Parse phase progress from SSE stage text
    const [phaseStates, setPhaseStates] = useState([]);
    useEffect(() => {
      if (!roadmap?.phases) return;
      // Build initial state
      const phases = roadmap.phases.map((p, idx) => ({
        phase: p.phase || idx + 1,
        title: p.title || `Phase ${idx + 1}`,
        status: 'pending', // pending, running, done, error
        message: '',
      }));
      setPhaseStates(phases);
    }, [roadmap]);

    useEffect(() => {
      if (!sseProgress?.stage || !roadmap?.phases) return;
      // Try to match stage like 'Phase X: ...'
      const match = sseProgress.stage.match(/Phase (\d+): (.+)/);
      setPhaseStates((prev) => {
        if (!prev || prev.length === 0) return prev;
        let updated = prev.map((p) => ({ ...p, status: p.status === 'running' ? 'done' : p.status }));
        if (match) {
          const phaseNum = parseInt(match[1], 10);
          const msg = match[2];
          updated = updated.map((p) => {
            if (p.phase === phaseNum) {
              return { ...p, status: msg.includes('parsed') ? 'done' : 'running', message: msg };
            }
            return p;
          });
        } else if (sseProgress.stage === 'Complete') {
          updated = updated.map((p) => ({ ...p, status: p.status === 'done' ? 'done' : 'pending', message: '' }));
        }
        return updated;
      });
    }, [sseProgress?.stage, roadmap]);

    if (!roadmap?.phases) return null;
    return (
      <div className="mb-8">
        <h3 className="text-white font-bold text-xl mb-4">Per-Phase Task Generation Progress</h3>
        <div className="flex flex-col gap-2">
          {phaseStates.map((p, idx) => (
            <div key={p.phase} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg
                ${p.status === 'done' ? 'bg-green-500 text-white' : p.status === 'running' ? 'bg-cyan-400 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>{p.status === 'done' ? '✓' : p.phase}</div>
              <div className="flex-1">
                <span className="font-semibold text-white">{p.title}</span>
                <span className="ml-2 text-sm text-cyan-300">{p.status === 'running' ? p.message : p.status === 'done' ? 'Done' : 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Path Selection Component
  const PathSelectionStep = () => {
    const pathOptions = Object.values(learningPaths);

    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <div className="w-full">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
                Choose Your Career Path
              </h1>
              <p className="text-lg mb-6 text-sky-700 dark:text-gray-300">
                Select the career path you want to pursue, then we'll personalize your learning journey
              </p>
            </div>

            {/* Learning Path Selection */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pathOptions.map((path) => (
                    <button
                      key={path.id}
                      onClick={() => handlePathSelection(path.id)}
                      className="p-6 rounded-xl border-2 transition-all duration-300 text-left border-white/20 bg-white/5 hover:border-cyan-400 hover:bg-cyan-500/10"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${path.difficulty === "advanced"
                            ? "bg-red-500/20"
                            : path.difficulty === "intermediate"
                              ? "bg-yellow-500/20"
                              : "bg-green-500/20"
                            }`}
                        >
                          {path.id === "ai-ml"
                            ? "🤖"
                            : path.id === "fullstack-web"
                              ? "💻"
                              : path.id === "cloud-computing"
                                ? "☁️"
                                : "📊"}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 text-indigo-700 dark:text-white">
                            {path.title}
                          </h4>
                          <p className="text-sky-700 text-sm mb-3 dark:text-gray-300">
                            {path.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span
                              className={`px-2 py-1 rounded-full ${path.difficulty === "advanced"
                                ? "bg-red-500/20 text-red-400"
                                : path.difficulty === "intermediate"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"}`}
                            >
                              {path.difficulty}
                            </span>
                            <span className="text-mint-700 dark:text-gray-400">
                              {path.duration.min}-{path.duration.max} months
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
                          {/* Personalized Roadmap and Success Prediction UI */}
                          {roadmap && (
                            <div className="mb-8">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h1 className="text-4xl font-bold mb-2">Your Personalized Roadmap</h1>
                                  <p className="text-gray-300">
                                    AI-generated learning path tailored to your profile and goals
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => (window.location.href = "/tasks")}
                                    className="btn-secondary btn-lg flex items-center gap-2"
                                  >
                                    Go to Tasks
                                  </button>
                                </div>
                              </div>
                              <div className="bg-[#181D24] rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between">
                                <div className="flex-1">
                                  <h2 className="text-2xl font-bold mb-2">Success Prediction</h2>
                                  <p className="text-gray-400 mb-4">
                                    Based on your profile and chosen timeline, our AI predicts your success probability
                                  </p>
                                  <div className="flex gap-8">
                                    <div>
                                      <div className="text-gray-400">Total Duration</div>
                                      <div className="text-white text-xl font-bold">{roadmap?.totalDuration} months</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Daily Commitment</div>
                                      <div className="text-white text-xl font-bold">{roadmap?.personalizedSchedule?.dailyHours}h/day</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Study Sessions</div>
                                      <div className="text-white text-xl font-bold">{roadmap?.personalizedSchedule?.sessionsPerDay}/day</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Success Rate</div>
                                      <div className="text-green-400 text-4xl font-bold">{Math.round((roadmap?.successPrediction || 0) * 100)}%</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

  // Goal Setup Component (now just timeline and personal needs)
  const GoalSetupStep = ({
    timeframe,
    setTimeframe,
    customGoal,
    setCustomGoal,
    motivation,
    setMotivation,
    selectedPath,
    handleGoalSetupComplete,
    assessmentAnswers
  }) => {
    // Local state for textarea
    const [localPersonalNeeds, setLocalPersonalNeeds] = useState("");

    // Minimal userProfile calculation for UI only
    function computeUserProfileFromAnswers(answers) {
      // Defensive: answers is array of indices, must match assessmentOptions
      if (!Array.isArray(answers) || answers.length < 6) return null;
      // Map indices to values for each question
      const getWeight = (idx, qIdx) => {
        // For each question, higher index = higher value
        // Scale to 1-5 for display
        if (idx === -1) return 0;
        const max = assessmentOptions[qIdx].length - 1;
        return Math.round(((idx / max) * 4) + 1); // 1-5 scale
      };
      return {
        learningSpeed: getWeight(answers[0], 0),
        focusCapability: getWeight(answers[1], 1),
        experienceLevel: getWeight(answers[2], 2),
        timeCommitment: getWeight(answers[4], 4),
      };
    }
    const userProfile = computeUserProfileFromAnswers(assessmentAnswers);

    const handleSubmit = () => {
      if (!timeframe) return;
      const months = parseInt(timeframe);
      // Only send learningPath, months, and personalize
      const goals = {
        learningPath: selectedPath,
        months,
        personalize: localPersonalNeeds,
      };
      handleGoalSetupComplete(goals);
    };

    const selectedPathData = learningPaths[selectedPath];

    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <div className="w-full">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
                Set Your Learning Timeline
              </h1>
              <p className="text-lg mb-6 text-sky-700 dark:text-gray-300">
                You've chosen {selectedPathData?.title}. Now let's set your timeline and preferences.
              </p>
            </div>

            {/* User Profile Summary */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-xl mb-4">
                  Your Learning Profile
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sky-700 font-semibold text-sm dark:text-cyan-400">
                      Learning Speed
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile ? (userProfile.learningSpeed >= 4 ? "Fast" : userProfile.learningSpeed >= 3 ? "Average" : "Methodical") : "N/A"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lavender-700 font-semibold text-sm dark:text-purple-400">
                      Focus Ability
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile ? (userProfile.focusCapability >= 4 ? "Excellent" : userProfile.focusCapability >= 3 ? "Good" : "Developing") : "N/A"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-mint-700 font-semibold text-sm dark:text-green-400">
                      Time Commitment
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile ? (userProfile.timeCommitment >= 4 ? "High" : userProfile.timeCommitment >= 3 ? "Medium" : "Limited") : "N/A"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-pink-700 font-semibold text-sm dark:text-orange-400">
                      Experience
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile ? (userProfile.experienceLevel >= 4 ? "Advanced" : userProfile.experienceLevel >= 3 ? "Intermediate" : "Beginner") : "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Path Summary */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-6">
                <h3 className="text-white font-bold text-xl mb-4">
                  Your Selected Path
                </h3>
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${selectedPathData?.difficulty === "advanced"
                      ? "bg-red-500/20"
                      : selectedPathData?.difficulty === "intermediate"
                        ? "bg-yellow-500/20"
                        : "bg-green-500/20"
                      }`}
                  >
                    {selectedPath === "ai-ml"
                      ? "🤖"
                      : selectedPath === "fullstack-web"
                        ? "💻"
                        : selectedPath === "cloud-computing"
                          ? "☁️"
                          : "📊"}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2 text-indigo-700 dark:text-white">
                      {selectedPathData?.title}
                    </h4>
                    <p className="text-sky-700 text-sm mb-3 dark:text-gray-300">
                      {selectedPathData?.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${selectedPathData?.difficulty === "advanced"
                          ? "bg-red-500/20 text-red-400"
                          : selectedPathData?.difficulty === "intermediate"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                          }`}
                      >
                        {selectedPathData?.difficulty}
                      </span>
                      <span className="text-mint-700 dark:text-gray-400">
                        {selectedPathData?.duration.min}-{selectedPathData?.duration.max} months
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentStep("pathSelection")}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Change Path
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeframe Selection */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">
                  Target Timeframe
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[2, 3, 4, 6].map((months) => (
                    <button
                      key={months}
                      onClick={() => setTimeframe(months.toString())}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-center ${timeframe === months.toString()
                        ? "border-cyan-400 bg-cyan-500/20"
                        : "border-sky-200 bg-sky-50/50 hover:border-sky-300 hover:bg-sky-100/50 dark:border-white/20 dark:bg-white/5 dark:hover:border-white/40 dark:hover:bg-white/10"
                        }`}
                    >
                      <div className="text-3xl mb-2">⏰</div>
                      <div className="text-indigo-700 font-bold text-xl dark:text-white">
                        {months} Months
                      </div>
                      <div className="text-sky-600 text-sm mt-1 dark:text-gray-400">
                        {months === 2
                          ? "Intensive"
                          : months === 3
                            ? "Focused"
                            : months === 4
                              ? "Balanced"
                              : "Comfortable"}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Personal Needs Section */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">
                  Personal Needs & Constraints
                </h3>
                <p className="text-gray-300 mb-6">
                  Tell us about your specific needs, preferences, or constraints to make your learning path more personalized.
                  For example: preferred technologies, time availability, learning style preferences, or any specific requirements.
                </p>

                <textarea
                  value={localPersonalNeeds}
                  onChange={e => setLocalPersonalNeeds(e.target.value)}
                  placeholder="Example: I prefer MERN stack technologies, can only study 2 hours in the evenings, need practical projects for my portfolio, have experience with basic HTML/CSS..."
                  className="w-full p-4 rounded-xl border-2 border-gray-600 bg-[#111111] text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all duration-300 resize-vertical min-h-[120px] max-h-[300px]"
                  maxLength={2000}
                />

                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400 text-sm">
                    Optional - helps create a more tailored learning experience
                  </span>
                  <span className={`text-sm ${localPersonalNeeds.length > 1800 ? 'text-red-400' : 'text-gray-400'}`}>
                    {localPersonalNeeds.length}/2000
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                disabled={!timeframe}
                variant="primary"
                size="xl"
              >
                Generate My Personalized Roadmap 🚀
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Roadmap Component
  const RoadmapStep = () => {
    const [currentPhase, setCurrentPhase] = useState(1);

    const totalDuration = roadmap?.totalDuration ? 
      `${roadmap.totalDuration} months` : 
      'N/A';
    const successProbability = Math.round(
      (roadmap?.successPrediction || 0) * 100
    );

    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <div className="w-full">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
                Your Personalized Roadmap
              </h1>
              <p className="text-lg mb-6 text-sky-700 dark:text-gray-300">
                AI-generated learning path tailored to your profile and goals
              </p>
            </div>

            {/* Success Prediction */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2">
                      Success Prediction
                    </h3>
                    <p className="text-gray-300">
                      Based on your profile and chosen timeline, our AI predicts
                      your success probability
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-6xl font-bold mb-2 ${successProbability >= 80
                        ? "text-blue-500 dark:text-green-400"
                        : successProbability >= 60
                          ? "text-cyan-500 dark:text-yellow-400"
                          : "text-red-400"
                        }`}
                    >
                      {successProbability}%
                    </div>
                    <div className="text-gray-300 text-sm">Success Rate</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-cyan-400 font-semibold text-sm">
                      Total Duration
                    </div>
                    <div className="text-white text-xl font-bold">
                      {totalDuration}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-indigo-400 font-semibold text-sm">
                      Daily Commitment
                    </div>
                    <div className="text-white text-xl font-bold">
                      {roadmap.dailyCommitment || 0}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-blue-400 font-semibold text-sm">
                      Study Sessions
                    </div>
                    <div className="text-white text-xl font-bold">
                      {roadmap.studySessions || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Phases */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">
                  Learning Phases
                </h3>

                <div className="space-y-6">
                  {roadmap?.phases?.map((phase, index) => (
                    <div
                      key={phase.phase}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${currentPhase === phase.phase
                        ? "border-cyan-400 bg-cyan-500/20"
                        : "border-sky-200 bg-sky-50/50 dark:border-white/20 dark:bg-white/5"
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${currentPhase === phase.phase
                              ? "bg-cyan-500 text-white"
                              : currentPhase > phase.phase
                                ? "bg-green-500 text-white"
                                : "bg-gray-600 text-gray-300"
                              }`}
                          >
                            {currentPhase > phase.phase ? "✓" : phase.phase}
                          </div>
                          <div>
                            <h4 className="text-indigo-700 font-bold text-xl dark:text-white">
                              {phase.title}
                            </h4>
                            <p className="text-sky-700 dark:text-gray-300">
                              Phase {phase.phase} • {phase.duration} months
                            </p>
                          </div>
                        </div>

                        {phase.adjustedForUser && (
                          <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                            <span className="text-purple-400 text-sm font-semibold">
                              AI Adjusted
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">
                            Topics Covered
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {phase.topics?.map((topic, topicIndex) => {
                              if (typeof topic === "string") {
                                return (
                                  <div
                                    key={topicIndex}
                                    className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm border border-blue-400/30 break-words whitespace-normal mb-2"
                                    style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                  >
                                    {topic}
                                  </div>
                                );
                              } else if (typeof topic === "object" && topic !== null) {
                                // Render object topic with title, subtopics, example
                                return (
                                  <div
                                    key={topicIndex}
                                    className="w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm border border-blue-400/30 break-words whitespace-normal mb-2"
                                    style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}
                                  >
                                    <strong>{topic.title}</strong>
                                    {topic.subtopics && Array.isArray(topic.subtopics) && (
                                      <>: {topic.subtopics.join(", ")}</>
                                    )}
                                    {topic.example && (
                                      <> | Example: {topic.example}</>
                                    )}
                                  </div>
                                );
                              } else {
                                return null;
                              }
                            })}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">
                            Key Projects
                          </h5>
                          <ul className="space-y-2">
                            {phase.projects?.map((project, projectIndex) => {
                              if (typeof project === "string") {
                                return (
                                  <li
                                    key={projectIndex}
                                    className="text-sky-700 flex items-center gap-2 dark:text-gray-300"
                                  >
                                    <span className="text-green-400">•</span>
                                    {project}
                                  </li>
                                );
                              } else if (typeof project === "object" && project !== null) {
                                return (
                                  <li
                                    key={projectIndex}
                                    className="text-sky-700 flex flex-col gap-1 dark:text-gray-300"
                                  >
                                    <span className="text-green-400">•</span>
                                    <span className="font-bold">{project.name}</span>
                                    {project.description && (
                                      <span className="text-xs text-gray-500">{project.description}</span>
                                    )}
                                    {project.technologies && Array.isArray(project.technologies) && (
                                      <span className="text-xs text-cyan-500">Tech: {project.technologies.join(", ")}</span>
                                    )}
                                  </li>
                                );
                              } else {
                                return null;
                              }
                            })}
                          </ul>
                          {/* Resources Section */}
                          {phase.resources && phase.resources.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">Resources</h5>
                              <ul className="list-disc ml-6">
                                {(phase.showAllResources ? phase.resources : phase.resources.slice(0, 3)).map((resource, resIdx) => (
                                  <li key={resIdx} className="text-gray-700 dark:text-gray-300 mb-2">
                                    <span className="font-bold text-blue-500">[{resource.type}]</span> {resource.title}
                                    {resource.url && (
                                      <>
                                        {' - '}
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">{resource.url}</a>
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ul>
                              {phase.resources.length > 3 && !phase.showAllResources && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    setRoadmapPhases((prevPhases) =>
                                      prevPhases.map((p, idx) =>
                                        idx === phaseIdx ? { ...p, showAllResources: true } : p
                                      )
                                    );
                                  }}
                                >
                                  View More
                                </Button>
                              )}
                              {phase.resources.length > 3 && phase.showAllResources && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    setRoadmapPhases((prevPhases) =>
                                      prevPhases.map((p, idx) =>
                                        idx === phaseIdx ? { ...p, showAllResources: false } : p
                                      )
                                    );
                                  }}
                                >
                                  Show Less
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {goalCreationError && (
              <Card className="!bg-red-900/20 backdrop-blur-md border border-red-500/30 rounded-3xl shadow-2xl mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="text-red-400 text-2xl">⚠️</div>
                    <div>
                      <h3 className="text-red-400 font-bold text-lg mb-2">
                        Goal Creation Failed
                      </h3>
                      <p className="text-red-300 text-sm">
                        {goalCreationError}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start Learning Button */}
            <div className="text-center">
              {!isTaskGenerationLoading && (() => {
                const timeline = roadmap?.totalDuration || goalData?.timeframe;
                const expectedTasks = timeline * 30; // ~30 tasks per month
                
                return (
                  <div className="mb-4">
                    <p className="text-gray-300 mb-2 text-sm">
                      🤖 Our AI will generate <strong>{expectedTasks} personalized tasks</strong> for your {timeline}-month learning journey.
                    </p>
                    <p className="text-gray-400 text-xs">
                      This process takes time to ensure quality - we generate comprehensive daily tasks, projects, and assessments.
                    </p>
                  </div>
                );
              })()}
              <Button
                onClick={handleStartLearning}
                disabled={isTaskGenerationLoading}
                variant="primary"
                size="xl"
              >
                {isTaskGenerationLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>{aiProgress.stage || 'Initializing comprehensive task generation...'}</span>
                    </div>
                    
                    {/* Upgraded Progress Bar */}
                    <div className="w-full max-w-md" aria-label="AI Progress" role="progressbar" aria-valuenow={Math.round(Math.max(aiProgress.progress, 0))} aria-valuemin={0} aria-valuemax={100}>
                      <div className="relative bg-[#181D24] rounded-full h-5 border border-cyan-400/70 overflow-hidden shadow-xl">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out shadow-cyan-400/30"
                          style={{
                            width: `${Math.max(aiProgress.progress, 0)}%`,
                            background: 'linear-gradient(90deg, #22d3ee 0%, #06b6d4 60%, #4ade80 100%)',
                            boxShadow: '0 0 16px 2px #22d3ee, 0 0 8px 2px #4ade80',
                            filter: aiProgress.progress === 100 ? 'brightness(1.2) saturate(1.2)' : 'none',
                          }}
                        ></div>
                        {/* Animated checkmark on completion */}
                        {aiProgress.progress === 100 && (
                          <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                            <span className="text-cyan-300 drop-shadow-lg text-2xl font-bold">✔</span>
                          </div>
                        )}
                      </div>
                      <div className="text-center text-lg text-cyan-200 mt-2 font-bold tracking-wide transition-all duration-700">
                        <span className="inline-block animate-fadeInUp">{Math.round(Math.max(aiProgress.progress, 0))}% Complete</span>
                      </div>
                    </div>
                    
                    {/* Task Generation Info */}
                    <div className="text-center text-xs text-gray-500 max-w-md">
                      <p>🎯 Generating comprehensive daily tasks, projects, and assessments</p>
                      <p>⏱️ Quality task generation takes time - please be patient</p>
                    </div>
                  </div>
                ) : (
                  "Start My Learning Journey 🚀"
                )}
              </Button>

              {!isTaskGenerationLoading && (
                <p className="text-gray-400 text-sm mt-4">
                  Your AI assistant will track your progress and adjust the plan
                  as needed
                </p>
              )}

              {isTaskGenerationLoading && (
                <div className="mt-6 space-y-2">
                  <p className="text-cyan-400 text-sm">
                    🤖 AI is generating your personalized tasks...
                  </p>
                  <p className="text-gray-400 text-xs">
                    This may take a few moments. Please don't close this page.
                  </p>
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading component for roadmap generation
  const GeneratingRoadmapStep = () => {
    // Use roadmapSse.progress for progress bar
    const percent = roadmapSse?.progress?.percent || 0;
    const stage = roadmapSse?.progress?.stage || "Initializing...";
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-4">
            Generating Your Personalized Roadmap
          </h2>
          <p className="text-gray-300 mb-6">
            Our AI is analyzing your profile and creating a customized learning path...
          </p>
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mb-6" aria-label="AI Progress" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
            <div className="relative bg-[#181D24] rounded-full h-5 border border-cyan-400/70 overflow-hidden shadow-xl">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out shadow-cyan-400/30"
                style={{
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, #22d3ee 0%, #06b6d4 60%, #4ade80 100%)',
                  boxShadow: '0 0 16px 2px #22d3ee, 0 0 8px 2px #4ade80',
                  filter: percent === 100 ? 'brightness(1.2) saturate(1.2)' : 'none',
                }}
              ></div>
              {/* Animated checkmark on completion */}
              {percent === 100 && (
                <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                  <span className="text-cyan-300 drop-shadow-lg text-2xl font-bold">✔</span>
                </div>
              )}
            </div>
            <div className="text-center text-lg text-cyan-200 mt-2 font-bold tracking-wide transition-all duration-700">
              <span className="inline-block animate-fadeInUp">{Math.round(percent)}% Complete</span>
            </div>
            <div className="text-center text-base text-cyan-300 mt-2 font-semibold">
              {stage}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">
                Analyzing your learning style
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <span className="text-sm text-gray-400">
                Designing learning phases
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
              <span className="text-sm text-gray-400">
                Calculating optimal timeline
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PROMPT ENGINEERING INSTRUCTION FOR AI (add to backend prompt):
  // "When generating the roadmap JSON, always calculate and include two fields for the user: 'dailyCommitment' (hours per day, e.g. '2h/day') and 'studySessions' (sessions per day, e.g. '2/day'). These should be based on the user's assessment answers and personalNeeds. Ensure the roadmap tasks are distributed to match these values, so the user receives a realistic and achievable workload."

  // --- Main render logic ---
  if (currentStep === "pathSelection") {
    return <PathSelectionStep />;
  }

  if (currentStep === "assessment" && selectedPath) {
    return <AssessmentScreen onComplete={handleAssessmentComplete} />;
  }

  if (currentStep === "goalSetup" && selectedPath) {
    return (
      <GoalSetupStep
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        customGoal={customGoal}
        setCustomGoal={setCustomGoal}
        motivation={motivation}
        setMotivation={setMotivation}
        selectedPath={selectedPath}
        handleGoalSetupComplete={handleGoalSetupComplete}
        assessmentAnswers={assessmentAnswers}
      />
    );
  }

  if (currentStep === "generatingRoadmap") {
    return <GeneratingRoadmapStep />;
  }

  if (currentStep === "roadmap" && goalData && roadmap) {
    return <RoadmapStep />;
  }

  if (isTaskGenerationLoading) {
    // Show per-phase progress UI during task generation
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl mx-auto p-8">
          <h2 className="text-2xl font-bold mb-4">Generating Your Personalized Tasks</h2>
          <PerPhaseProgress sseProgress={tasksSse.progress} roadmap={roadmap} />
          <div className="w-full max-w-md mx-auto mb-6" aria-label="AI Progress" role="progressbar" aria-valuenow={Math.round(aiProgress.progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className="relative bg-[#181D24] rounded-full h-5 border border-cyan-400/70 overflow-hidden shadow-xl">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out shadow-cyan-400/30"
                style={{
                  width: `${Math.max(aiProgress.progress, 0)}%`,
                  background: 'linear-gradient(90deg, #22d3ee 0%, #06b6d4 60%, #4ade80 100%)',
                  boxShadow: '0 0 16px 2px #22d3ee, 0 0 8px 2px #4ade80',
                  filter: aiProgress.progress === 100 ? 'brightness(1.2) saturate(1.2)' : 'none',
                }}
              ></div>
              {aiProgress.progress === 100 && (
                <div className="absolute inset-0 flex items-center justify-center animate-bounce">
                  <span className="text-cyan-300 drop-shadow-lg text-2xl font-bold">✔</span>
                </div>
              )}
            </div>
            <div className="text-center text-lg text-cyan-200 mt-2 font-bold tracking-wide transition-all duration-700">
              <span className="inline-block animate-fadeInUp">{Math.round(Math.max(aiProgress.progress, 0))}% Complete</span>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 max-w-md mx-auto mt-4">
            <p>🎯 Generating daily tasks for each phase. This may take a few minutes.</p>
            <p>⏱️ Please do not close this page until complete.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to path selection if something goes wrong
  return <PathSelectionStep />;
};
export default AssessmentPage;
