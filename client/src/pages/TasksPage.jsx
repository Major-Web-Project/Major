import React, { useState, useEffect } from "react";
import { TasksScreen } from "../components/tasks/TasksScreen";
import { aiAssistant } from "../services/aiLearningService";
import { useTasks } from "../contexts/TasksContext";

export default function TasksPage() {
  const { refreshTasks } = useTasks();
  const [userGoals, setUserGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user goals from database
        const goals = await aiAssistant.getUserGoals();
        setUserGoals(goals);

        if (goals.length > 0) {
          // Select the first active goal by default
          const activeGoal =
            goals.find((goal) => goal.status === "active") || goals[0];
          setSelectedGoal(activeGoal);

          // Load all tasks for the selected goal
          const tasks = await aiAssistant.getAllTasks(activeGoal._id);
          setAllTasks(tasks);
        }

        // Refresh tasks from the main task system
        await refreshTasks();
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshTasks]);

  const handleGoalChange = async (goalId) => {
    try {
      setLoading(true);
      const goal = userGoals.find((g) => g._id === goalId);
      setSelectedGoal(goal);

      // Load tasks for the selected goal
      const tasks = await aiAssistant.getAllTasks(goalId);
      setAllTasks(tasks);
    } catch (error) {
      console.error("Error changing goal:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId) => {
    console.log("Task completed:", taskId);

    // Refresh tasks after completion
    await refreshTasks();

    // Reload tasks for the current goal
    if (selectedGoal) {
      try {
        const tasks = await aiAssistant.getAllTasks(selectedGoal._id);
        setAllTasks(tasks);
      } catch (error) {
        console.error("Error reloading tasks:", error);
      }
    }
  };

  const handleCreateNewGoal = async () => {
    // This would typically navigate to the assessment/goal creation flow
    // For now, we'll just show a message
    alert(
      "To create a new goal, please complete the assessment and goal setup process."
    );
  };

  if (loading) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading your tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Error loading tasks</div>
          <div className="text-gray-400 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (userGoals.length === 0) {
    return (
      <div className="bg-[#111111] min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-xl mb-4">No goals found</div>
          <div className="text-gray-400 mb-4">
            You need to create a learning goal to get started with tasks.
          </div>
          <button
            onClick={handleCreateNewGoal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Your First Goal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] min-h-screen">
      {/* Goal Selector */}
      <div className="p-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">
              Your Learning Tasks
            </h1>
            <button
              onClick={handleCreateNewGoal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
            >
              + New Goal
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {userGoals.map((goal) => (
              <button
                key={goal._id}
                onClick={() => handleGoalChange(goal._id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedGoal?._id === goal._id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {goal.field}
                {goal.status === "active" && (
                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks Screen */}
      {selectedGoal && (
        <TasksScreen
          userProfile={selectedGoal.userProfile}
          learningData={{
            currentPhase: selectedGoal.currentPhase,
            dayNumber: selectedGoal.currentDay,
          }}
          aiTasksData={allTasks}
          roadmap={selectedGoal.roadmap}
          goalData={selectedGoal}
          onTaskComplete={handleTaskComplete}
        />
      )}
    </div>
  );
}
