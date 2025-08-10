import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AssessmentScreen from "../components/learning/AssessmentScreen";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  learningPaths,
  aiAssistant,
  assessmentQuestions,
} from "../services/aiLearningService";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState("assessment"); // assessment, goalSetup, roadmap
  const [userProfile, setUserProfile] = useState(null);
  const [goalData, setGoalData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("aiLearning_userProfile");
    const savedGoalData = localStorage.getItem("aiLearning_goalData");
    const savedRoadmap = localStorage.getItem("aiLearning_roadmap");
    const savedLearningData = localStorage.getItem("aiLearning_learningData");
    const savedStep = localStorage.getItem("aiLearning_currentStep");

    // If user already has a complete learning setup, redirect to learning dashboard
    if (savedProfile && savedGoalData && savedRoadmap && savedLearningData) {
      navigate("/learning-dashboard");
      return;
    }

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    if (savedGoalData) {
      setGoalData(JSON.parse(savedGoalData));
    }
    if (savedRoadmap) {
      setRoadmap(JSON.parse(savedRoadmap));
    }
    if (savedStep && savedProfile) {
      setCurrentStep(savedStep);
    }
  }, [navigate]);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleAssessmentComplete = (profile, responses) => {
    setUserProfile(profile);

    // Save detailed assessment data for future AI model integration
    const assessmentData = {
      userProfile: profile,
      responses: responses,
      timestamp: new Date().toISOString(),
      completedSections: Object.keys(assessmentQuestions),
      totalQuestions: Object.values(assessmentQuestions).reduce(
        (sum, section) => sum + section.length,
        0
      ),
      responsesByCategory: responses.reduce((acc, response) => {
        if (!acc[response.category]) {
          acc[response.category] = [];
        }
        acc[response.category].push(response);
        return acc;
      }, {}),
    };

    localStorage.setItem("aiLearning_userProfile", JSON.stringify(profile));
    localStorage.setItem(
      "aiLearning_assessmentResponses",
      JSON.stringify(responses)
    );
    localStorage.setItem(
      "aiLearning_assessmentData",
      JSON.stringify(assessmentData)
    );
    localStorage.setItem("aiLearning_currentStep", "goalSetup");
    setCurrentStep("goalSetup");
  };

  const handleGoalSetupComplete = async (goals) => {
    setGoalData(goals);

    // Show loading state for roadmap generation
    setCurrentStep("generatingRoadmap");

    try {
      // Generate roadmap with AI
      const generatedRoadmap = await aiAssistant.generateRoadmapWithAI(goals);

      setRoadmap(generatedRoadmap);
      localStorage.setItem("aiLearning_goalData", JSON.stringify(goals));
      localStorage.setItem(
        "aiLearning_roadmap",
        JSON.stringify(generatedRoadmap)
      );
      localStorage.setItem("aiLearning_currentStep", "roadmap");
      setCurrentStep("roadmap");
    } catch (error) {
      console.error("Error generating roadmap:", error);
      alert("Failed to generate roadmap. Please try again.");
      setCurrentStep("goalSetup");
    }
  };

  const handleStartLearning = async () => {
    try {
      // Pull persisted assessment data if available
      const storedAssessment = JSON.parse(
        localStorage.getItem("aiLearning_assessmentData") || "{}"
      );

      // Build payload without referencing itself
      const payload = {
        field: roadmap?.title || goalData?.learningPath || "Learning Goal",
        description:
          (goalData && goalData.customGoal) ||
          `Master ${roadmap?.title || "Goal"}`,
        timeline: roadmap?.totalDuration || goalData?.timeframe || 1,
        strengths: userProfile?.strengths || [],
        weaknesses: userProfile?.challenges || [],
        roadmap: roadmap || {},
        userProfile: userProfile || {},
        assessmentData: storedAssessment || {},
        goalSetup: goalData || {},
        currentPhase: 1,
        currentDay: 1,
      };

      const created = await aiAssistant.createGoalWithTasks(payload);

      // Store the created goal data
      localStorage.setItem("aiLearning_goalData", JSON.stringify(payload));
      localStorage.setItem(
        "aiLearning_learningData",
        JSON.stringify({
          goalData: payload,
          roadmap,
          userProfile,
          currentPhase: 1,
          dayNumber: 1,
        })
      );
      localStorage.removeItem("aiLearning_currentStep");

      // Navigate to tasks page to see the generated tasks
      navigate("/tasks");
    } catch (error) {
      console.error("Error creating goal with tasks:", error);
      alert("Failed to create goal with tasks. Please try again.");
    }
  };

  // Goal Setup Component
  const GoalSetupStep = () => {
    const [selectedPath, setSelectedPath] = useState("");
    const [timeframe, setTimeframe] = useState("");
    const [customGoal, setCustomGoal] = useState("");
    const [motivation, setMotivation] = useState("");

    const handleSubmit = () => {
      if (!selectedPath || !timeframe) return;

      const goals = {
        learningPath: selectedPath,
        timeframe: parseInt(timeframe),
        customGoal,
        motivation,
        userProfile,
      };

      handleGoalSetupComplete(goals);
    };

    const pathOptions = Object.values(learningPaths);

    return (
      <div className="min-h-screen bg-[#111111] text-white">
        <div className="w-full">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
                Set Your Learning Goal
              </h1>
              <p className="text-lg mb-6 text-sky-700 dark:text-gray-300">
                Choose your career path and timeline to get a personalized
                roadmap
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
                      {userProfile.learningSpeed >= 3.5
                        ? "Fast"
                        : userProfile.learningSpeed >= 2.5
                        ? "Average"
                        : "Methodical"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lavender-700 font-semibold text-sm dark:text-purple-400">
                      Focus Ability
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile.focusCapability >= 3.5
                        ? "Excellent"
                        : userProfile.focusCapability >= 2.5
                        ? "Good"
                        : "Developing"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-mint-700 font-semibold text-sm dark:text-green-400">
                      Time Commitment
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile.timeCommitment >= 3.5
                        ? "High"
                        : userProfile.timeCommitment >= 2.5
                        ? "Medium"
                        : "Limited"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-pink-700 font-semibold text-sm dark:text-orange-400">
                      Experience
                    </div>
                    <div className="text-indigo-700 text-lg font-bold dark:text-white">
                      {userProfile.experienceLevel >= 3.5
                        ? "Advanced"
                        : userProfile.experienceLevel >= 2.5
                        ? "Intermediate"
                        : "Beginner"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Path Selection */}
            <Card className="!bg-[#181D24] backdrop-blur-md border border-gray-700 rounded-3xl shadow-2xl mb-8">
              <CardContent className="p-8">
                <h3 className="text-white font-bold text-2xl mb-6">
                  Choose Your Career Path
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pathOptions.map((path) => (
                    <button
                      key={path.id}
                      onClick={() => setSelectedPath(path.id)}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                        selectedPath === path.id
                          ? "border-cyan-400 bg-cyan-500/20"
                          : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            path.difficulty === "advanced"
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
                              className={`px-2 py-1 rounded-full ${
                                path.difficulty === "advanced"
                                  ? "bg-red-500/20 text-red-400"
                                  : path.difficulty === "intermediate"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}
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
                      className={`p-6 rounded-xl border-2 transition-all duration-300 text-center ${
                        timeframe === months.toString()
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

            {/* Submit Button */}
            <div className="text-center">
              <Button
                onClick={handleSubmit}
                disabled={!selectedPath || !timeframe}
                className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl transition-all duration-300 font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
    const [dayNumber, setDayNumber] = useState(1);

    const totalWeeks =
      roadmap?.phases.reduce((sum, phase) => sum + phase.duration, 0) || 0;
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
                      className={`text-6xl font-bold mb-2 ${
                        successProbability >= 80
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
                      {totalWeeks} weeks
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-indigo-400 font-semibold text-sm">
                      Daily Commitment
                    </div>
                    <div className="text-white text-xl font-bold">
                      {roadmap?.personalizedSchedule?.dailyHours || 0}h/day
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <div className="text-blue-400 font-semibold text-sm">
                      Study Sessions
                    </div>
                    <div className="text-white text-xl font-bold">
                      {roadmap?.personalizedSchedule?.sessionsPerDay || 0}/day
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
                      className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        currentPhase === phase.phase
                          ? "border-cyan-400 bg-cyan-500/20"
                          : "border-sky-200 bg-sky-50/50 dark:border-white/20 dark:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                              currentPhase === phase.phase
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
                              Phase {phase.phase} • {phase.duration} weeks
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
                            {phase.topics?.map((topic, topicIndex) => (
                              <span
                                key={topicIndex}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-400/30"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">
                            Key Projects
                          </h5>
                          <ul className="space-y-2">
                            {phase.projects?.map((project, projectIndex) => (
                              <li
                                key={projectIndex}
                                className="text-sky-700 flex items-center gap-2 dark:text-gray-300"
                              >
                                <span className="text-green-400">•</span>
                                {project}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Start Learning Button */}
            <div className="text-center">
              <Button
                onClick={handleStartLearning}
                className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-cyan-500/25"
              >
                Start My Learning Journey 🚀
              </Button>

              <p className="text-gray-400 text-sm mt-4">
                Your AI assistant will track your progress and adjust the plan
                as needed
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading component for roadmap generation
  const GeneratingRoadmapStep = () => {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-4">
            Generating Your Personalized Roadmap
          </h2>
          <p className="text-gray-300 mb-6">
            Our AI is analyzing your profile and creating a customized learning
            path...
          </p>
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

  // Main render logic
  if (currentStep === "assessment") {
    return <AssessmentScreen onComplete={handleAssessmentComplete} />;
  }

  if (currentStep === "goalSetup" && userProfile) {
    return <GoalSetupStep />;
  }

  if (currentStep === "generatingRoadmap") {
    return <GeneratingRoadmapStep />;
  }

  if (currentStep === "roadmap" && goalData && roadmap && userProfile) {
    return <RoadmapStep />;
  }

  // Fallback to assessment if something goes wrong
  return <AssessmentScreen onComplete={handleAssessmentComplete} />;
};
export default AssessmentPage;
