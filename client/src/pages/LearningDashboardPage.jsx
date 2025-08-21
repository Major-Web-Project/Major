import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LearningDashboardScreen } from "../components/learning/LearningDashboardScreen";
import { useAuth } from "../hooks/useAuth.js";
import { useGoalStore } from "../store/goalStore.js";
import { useAppStore } from "../store/appStore.js";
import { useDashboardStore } from "../store/dashboardStore.js";
import { aiAssistant } from "../services/aiLearningService";
import GoalSelector from "../components/ui/GoalSelector.jsx";
import NoGoalsGuard from "../components/ui/NoGoalsGuard.jsx";

const LearningDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeGoalId, getActiveGoal, hasGoals, initializeGoals, setActiveGoal, goals } = useGoalStore();
  const { setCurrentPage } = useAppStore();
  const { fetchLearningStats } = useDashboardStore();
  
  const [learningData, setLearningData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [aiTasksData, setAiTasksData] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeGoal = getActiveGoal();

  // Set current page and scroll to top when page loads
  useEffect(() => {
    setCurrentPage('learning');
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setCurrentPage]);

  useEffect(() => {
    const loadLearningData = async () => {
      try {
        setLoading(true);
        // Ensure goals are loaded
        if (!hasGoals()) {
          await initializeGoals();
        }

        // Auto-select most recent goal if none selected
        if (!activeGoalId && hasGoals() && goals.length > 0) {
          const mostRecentGoal = goals.reduce((latest, current) => {
            const latestDate = new Date(latest.createdAt || latest._id);
            const currentDate = new Date(current.createdAt || current._id);
            return currentDate > latestDate ? current : latest;
          });
          if (mostRecentGoal && mostRecentGoal._id) {
            setActiveGoal(mostRecentGoal._id);
          }
          setLoading(false);
          return;
        }

        if (!hasGoals() || !activeGoal) {
          // If no goals, the NoGoalsGuard will handle redirection
          setLoading(false);
          return;
        }

        // Try to load data from the active goal first
        if (activeGoal.roadmap) {
          setRoadmap(activeGoal.roadmap);
          // Create learning data from goal
          const goalLearningData = {
            goalData: activeGoal,
            roadmap: activeGoal.roadmap,
            currentPhase: activeGoal.currentPhase || 1,
            isGoalActive: true,
            goalStartDate: activeGoal.createdAt || new Date().toISOString(),
          };
          setLearningData(goalLearningData);
          // Load AI tasks for the active goal
          try {
            const aiTasks = await aiAssistant.getAllTasks(activeGoal._id);
            console.log("Loaded AI tasks for dashboard:", aiTasks);
            setAiTasksData(aiTasks || []);
          } catch (aiError) {
            console.warn("Could not load AI tasks for dashboard:", aiError);
            setAiTasksData([]);
          }
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading learning data:", error);
        setLoading(false);
      }
    };

    loadLearningData();

    // Listen for goal changes
    const handleGoalChanged = async (event) => {
      console.log("Learning: Goal changed, refreshing data...");
      const { activeGoalId: newGoalId } = event.detail;
      try {
        await fetchLearningStats(newGoalId);
        // Reload learning data and AI tasks for new goal
        loadLearningData();
      } catch (err) {
        console.error("Failed to refresh learning data after goal change:", err);
      }
    };

    // Listen for task updates from other pages
    const handleTasksUpdated = async (event) => {
      console.log("Learning Dashboard: Tasks updated from other pages", event.detail);
      
      // Refresh AI tasks when tasks are updated elsewhere
      if (activeGoal && activeGoal._id) {
        try {
          const aiTasks = await aiAssistant.getAllTasks(activeGoal._id);
          setAiTasksData(aiTasks || []);
        } catch (error) {
          console.error("Error refreshing AI tasks after external update:", error);
        }
      }
    };

    window.addEventListener("goalChanged", handleGoalChanged);
    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("goalChanged", handleGoalChanged);
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, [navigate, hasGoals, activeGoal, fetchLearningStats, initializeGoals, setActiveGoal, goals, activeGoalId]);

  const handleTaskComplete = async (progressEntry) => {
    console.log("Task completed:", progressEntry);
    
    // Refresh AI tasks after completion to sync with database
    if (activeGoal && activeGoal._id) {
      try {
        // Add a small delay to ensure backend has processed the submission
        setTimeout(async () => {
          const aiTasks = await aiAssistant.getAllTasks(activeGoal._id);
          console.log("Refreshed AI tasks after completion:", aiTasks);
          setAiTasksData(aiTasks || []);
        }, 1000);
      } catch (error) {
        console.error("Error reloading AI tasks after completion:", error);
      }
    }
  };

  const handleUpdateProgress = (progressUpdate) => {
    const updatedLearningData = {
      ...learningData,
      ...progressUpdate,
    };
    setLearningData(updatedLearningData);
    localStorage.setItem(
      "aiLearning_learningData",
      JSON.stringify(updatedLearningData)
    );
  };

  if (loading || !learningData || !roadmap) {
    return (
      <NoGoalsGuard>
        <div className="min-h-screen bg-[#111111] flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">
              Loading your AI learning dashboard...
            </div>
            <div className="text-gray-400">
              If this takes too long, you may need to complete the assessment
              first.
            </div>
            <button
              onClick={() => navigate("/assessment?new=true")}
              className="btn-primary btn-lg mt-4"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </NoGoalsGuard>
    );
  }

  return (
    <NoGoalsGuard>
      <div className="bg-[#111111] min-h-screen">
        {/* Header with Goal Selector */}
        <div className="p-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold text-white">
                Learning Dashboard
              </h1>
              <GoalSelector />
            </div>
          </div>
        </div>

        {/* Learning Dashboard Screen */}
        <LearningDashboardScreen
          learningData={learningData}
          roadmap={roadmap}
          aiTasksData={aiTasksData}
          onTaskComplete={handleTaskComplete}
          onUpdateProgress={handleUpdateProgress}
        />
      </div>
    </NoGoalsGuard>
  );
};

export default LearningDashboardPage;
