import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LearningDashboardScreen } from "../components/learning/LearningDashboardScreen";
import { useAuth } from "../hooks/useAuth.js";
import { useGoalStore } from "../store/goalStore.js";
import { useAppStore } from "../store/appStore.js";
import { useDashboardStore } from "../store/dashboardStore.js";
import { useTasks } from "../contexts/TasksContext";
import { apiService } from "../services/api.js";
import GoalSelector from "../components/ui/GoalSelector.jsx";
import NoGoalsGuard from "../components/ui/NoGoalsGuard.jsx";

const LearningDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeGoalId, getActiveGoal, hasGoals, initializeGoals, setActiveGoal, goals } = useGoalStore();
  const { setCurrentPage } = useAppStore();
  const { fetchLearningStats } = useDashboardStore();
  const { refreshAITasks, taskStatistics } = useTasks();
  
  const [learningData, setLearningData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiTasks, setAiTasks] = useState([]);

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
        
        // Only proceed if we have goals (NoGoalsGuard handles the no-goals case)
        if (!hasGoals()) {
          setLoading(false);
          return;
        }

        // Auto-select most recent goal if none selected
        if (!activeGoalId && goals.length > 0) {
          const mostRecentGoal = goals.reduce((latest, current) => {
            const latestDate = new Date(latest.createdAt || latest._id);
            const currentDate = new Date(current.createdAt || current._id);
            return currentDate > latestDate ? current : latest;
          });
          if (mostRecentGoal && mostRecentGoal._id) {
            setActiveGoal(mostRecentGoal._id);
            setLoading(false);
            return;
          }
        }

        if (!hasGoals() || !activeGoal) {
          // If no goals, let NoGoalsGuard handle it
          setLoading(false);
          return;
        }

        console.log("[LearningDashboard] Loading data for goal:", activeGoal._id);

        // Load AI tasks and statistics for the active goal
        let loadedAiTasks = [];
        if (activeGoal._id) {
          try {
            console.log("[LearningDashboard] Loading AI tasks for goal:", activeGoal._id);
            const aiTaskResult = await refreshAITasks(activeGoal._id);
            loadedAiTasks = aiTaskResult.tasks || [];
            setAiTasks(loadedAiTasks);
            
            // If no AI tasks found, try to create them from stored output
            if (loadedAiTasks.length === 0 && activeGoal.taskPromptOutput) {
              console.log("[LearningDashboard] No AI tasks found, creating from stored output...");
              try {
                await apiService.createTasksFromAIOutput(activeGoal._id);
                // Retry loading tasks after creation
                const retryResult = await refreshAITasks(activeGoal._id);
                loadedAiTasks = retryResult.tasks || [];
                setAiTasks(loadedAiTasks);
              } catch (createError) {
                console.warn("[LearningDashboard] Could not create tasks from AI output:", createError);
              }
            }
          } catch (aiError) {
            console.warn("[LearningDashboard] Error loading AI tasks:", aiError);
            setAiTasks([]);
            loadedAiTasks = [];
          }
        }

        // Always create learning data, even if no roadmap exists
        const goalLearningData = {
          goalData: activeGoal,
          roadmap: activeGoal.roadmap || null,
          currentPhase: activeGoal.currentPhase || 1,
          isGoalActive: true,
          goalStartDate: activeGoal.createdAt || new Date().toISOString(),
          // Include AI task statistics
          taskStatistics: taskStatistics,
          aiTasks: loadedAiTasks,
        };
        
        setLearningData(goalLearningData);
        setRoadmap(activeGoal.roadmap || null);
        
        console.log("[LearningDashboard] Learning data loaded successfully");
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

    // Listen for AI task updates
    const handleAITasksUpdated = async (event) => {
      console.log("Learning: AI tasks updated, refreshing data...");
      const { tasks, statistics } = event.detail;
      setAiTasks(tasks || []);
      
      // Update learning data with new statistics
      if (learningData) {
        setLearningData({
          ...learningData,
          taskStatistics: statistics,
          aiTasks: tasks,
        });
      }
    };

    window.addEventListener("goalChanged", handleGoalChanged);
    window.addEventListener("aiTasksUpdated", handleAITasksUpdated);
    
    return () => {
      window.removeEventListener("goalChanged", handleGoalChanged);
      window.removeEventListener("aiTasksUpdated", handleAITasksUpdated);
    };
  }, [navigate, hasGoals, activeGoal, fetchLearningStats, setActiveGoal, goals, activeGoalId, refreshAITasks]);

    const handleTaskComplete = async (taskId) => {
    try {
      console.log("[LearningDashboard] Completing task:", taskId);
      
      // Handle AI task completion
      const isAITask = aiTasks.some(task => task._id === taskId);
      
      if (isAITask) {
        // Find the AI task
        const aiTask = aiTasks.find(task => task._id === taskId);
        if (aiTask && activeGoal) {
          // Update task completion status in the backend
          await apiService.completeTask(taskId);
          
          // Add to completed tasks in goal
          const updatedGoal = {
            ...activeGoal,
            completedTaskIds: [...(activeGoal.completedTaskIds || []), taskId]
          };
          
          // Update goal in context
          await setActiveGoal(updatedGoal._id, updatedGoal);
          
          // Refresh AI tasks and statistics
          const refreshResult = await refreshAITasks(activeGoal._id);
          setAiTasks(refreshResult.tasks || []);
          
          // Update learning data with new statistics
          if (learningData) {
            setLearningData({
              ...learningData,
              taskStatistics: taskStatistics,
              aiTasks: refreshResult.tasks || [],
            });
          }
          
          // Dispatch event for other components
          window.dispatchEvent(new CustomEvent("aiTasksUpdated", { 
            detail: { 
              tasks: refreshResult.tasks || [],
              statistics: taskStatistics
            } 
          }));
          
          console.log("[LearningDashboard] AI task completed successfully");
        }
      } else {
        // Handle regular task completion (legacy tasks)
        console.log("[LearningDashboard] Completing regular task:", taskId);
        // Add existing regular task completion logic here if needed
      }
      
    } catch (error) {
      console.error("Error completing task:", error);
      // Show error message to user
      alert("Failed to complete task. Please try again.");
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


  // Only show loading if we have goals and are loading data
  if (hasGoals() && (loading || !learningData)) {
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

  // Only show error if we have goals but failed to load learning data after loading is complete
  if (hasGoals() && !loading && !learningData) {
    return (
      <NoGoalsGuard>
        <div className="min-h-screen bg-[#111111] flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-xl mb-4">Error loading learning dashboard</div>
            <div className="text-gray-400 mb-4">Please try again or refresh the page.</div>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary btn-md"
            >
              Retry
            </button>
          </div>
        </div>
      </NoGoalsGuard>
    );
  }

  // Always wrap in NoGoalsGuard, let it handle no-goals UI
  return (
    <NoGoalsGuard>
      <div className="bg-[#111111] min-h-screen">
        {/* Learning Dashboard Screen (header is inside) */}
        <LearningDashboardScreen
          learningData={learningData}
          roadmap={roadmap}
          selectedGoal={activeGoal}
          taskStatistics={taskStatistics}
          aiTasks={aiTasks}
          onTaskComplete={handleTaskComplete}
          onUpdateProgress={handleUpdateProgress}
        />
      </div>
    </NoGoalsGuard>
  );
};

export default LearningDashboardPage;
