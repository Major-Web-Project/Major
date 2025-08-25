import React, { useState, useEffect } from "react";
import { TasksScreen } from "../components/tasks/TasksScreen";
import { useTasks } from "../contexts/TasksContext";
import { useGoalStore } from "../store/goalStore.js";
import { useAppStore } from "../store/appStore.js";
import { useTaskStore } from "../store/taskStore.js";
import GoalSelector from "../components/ui/GoalSelector.jsx";

import NoGoalsGuard from "../components/ui/NoGoalsGuard.jsx";


export default function TasksPage() {
  const { refreshTasks } = useTasks();
  const { goals, activeGoalId, getActiveGoal, hasGoals, initializeGoals, setActiveGoal } = useGoalStore();
  const { setCurrentPage } = useAppStore();
  const { tasks, fetchTasks, isLoading: tasksLoading } = useTaskStore();

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeGoal = getActiveGoal();

  // Set current page for app store
  useEffect(() => {
    setCurrentPage('tasks');
  }, [setCurrentPage]);



  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only proceed if we have goals (NoGoalsGuard handles the no-goals case)
        if (!hasGoals()) {
          setLoading(false);
          return;
        }

        // If no active goal is set but there are goals, auto-select the most recent
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

        // Only fetch tasks if we have goals and an active goal
        if (hasGoals() && activeGoalId) {
          await fetchTasks(activeGoalId);
          try {
            const taskList = await refreshTasks(activeGoalId);
            setAllTasks(taskList || []);
          } catch (aiError) {
            console.warn("Could not load tasks:", aiError);
            setAllTasks([]);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for goal changes
    const handleGoalChanged = async (event) => {
      const { activeGoalId: newGoalId } = event.detail;
      if (!newGoalId) return;
      try {
        await fetchTasks(newGoalId);
        const taskList = await refreshTasks(newGoalId);
        setAllTasks(taskList || []);
        setError(null);
      } catch (err) {
        console.error("Failed to refresh tasks after goal change:", err);
      }
    };

    // Listen for real-time task updates
    const handleTasksUpdated = async (event) => {
      console.log("[TasksPage] Received task update event:", event.detail);
      
      // If new tasks were generated or added, refresh the task list
      if (event.detail?.action === "tasksGenerated" || 
          event.detail?.action === "newTasksAdded") {
        
        // Only refresh if it's for the current active goal
        if (event.detail?.goalId === activeGoalId || !event.detail?.goalId) {
          console.log("[TasksPage] Refreshing tasks due to:", event.detail.action);
          
          try {
            // Refresh both regular tasks and AI tasks
            await fetchTasks(activeGoalId);
            const taskList = await refreshTasks(activeGoalId);
            setAllTasks(taskList || []);
            setError(null);
          } catch (error) {
            console.error("[TasksPage] Error refreshing tasks:", error);
          }
        }
      }
    };

    window.addEventListener("goalChanged", handleGoalChanged);
    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("goalChanged", handleGoalChanged);
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, [activeGoalId, hasGoals, goals, fetchTasks, refreshTasks, setActiveGoal]);

  // Goal changing is now handled by the GoalSelector component and goal store

  const handleTaskComplete = async (taskId) => {
    // Refresh tasks after completion
    await refreshTasks(activeGoalId);

    // Reload tasks for the current goal
    if (activeGoalId) {
      try {
        await fetchTasks(activeGoalId);
        const taskList = await refreshTasks(activeGoalId);
        setAllTasks(taskList || []);
      } catch (error) {
        console.error("Error reloading tasks:", error);
      }
    }
  };



  // Only show loading if we have goals but are loading task data

  // Only show loading if we have goals and are loading data
  if (hasGoals() && (loading || tasksLoading)) {
    return (
      <NoGoalsGuard>
        <div className="bg-[#111111] min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading your tasks...</div>
        </div>
      </NoGoalsGuard>
    );
  }

  // Only show error if we have goals but failed to load task data
  if (hasGoals() && error) {
    return (
      <NoGoalsGuard>
        <div className="bg-[#111111] min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-xl mb-4">Error loading tasks</div>
            <div className="text-gray-400 mb-4">{error}</div>
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

  return (
    <NoGoalsGuard>
      <div className="bg-[#111111] min-h-screen">
        {/* Unified Goal Header Section */}
        <div className="p-4 border-b border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              {/* Left: Goal Title/Timeline/Phase */}
              <div className="flex flex-col">
                {activeGoal && (
                  <>
                    <span className="text-2xl font-bold text-white mb-1">{activeGoal.field}</span>
                    <span className="text-gray-400 text-sm">
                      {activeGoal.timeline} months • Phase {activeGoal.currentPhase || 1}
                    </span>
                  </>
                )}
              </div>
              {/* Right: Goal Selector */}
              <div className="flex-shrink-0">
                <GoalSelector />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Screen */}
        {activeGoal ? (
          <TasksScreen
            learningData={{
              currentPhase: activeGoal.currentPhase,
            }}
            aiTasksData={allTasks}
            roadmap={activeGoal.roadmap}
            goalData={activeGoal}
            onTaskComplete={handleTaskComplete}
          />
        ) : null}
      </div>
    </NoGoalsGuard>
  );
}
