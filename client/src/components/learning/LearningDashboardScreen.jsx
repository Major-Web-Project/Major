import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  aiAssistant,
  completeCurrentGoal,
  resetCurrentGoal,
  getGoalProgress,
} from "../../services/aiLearningService";
import { taskSyncService } from "../../services/taskSyncService";
import { useTasks } from "../../contexts/TasksContext";
import { TaskSubmitButton } from "../tasks/TaskSubmitButton";
import { apiService } from "../../services/api";
import { useGoalStore } from "../../store/goalStore";
import ResourceDisplay from "../tasks/ResourceDisplay.jsx";

export const LearningDashboardScreen = ({
  learningData,
  userProfile,
  roadmap,
  dashboardData,
  aiTasksData,
  onTaskComplete,
  onUpdateProgress,
}) => {
  const { createTask, refreshTasks } = useTasks();
  const { deleteGoal, getActiveGoal } = useGoalStore();
  const [currentTasks, setCurrentTasks] = useState(
    Array.isArray(aiTasksData) ? aiTasksData : []
  );
  const [analytics, setAnalytics] = useState(dashboardData || null);
  const [recommendations, setRecommendations] = useState([]);
  const [taskTimers, setTaskTimers] = useState({});
  const [goalProgress] = useState(getGoalProgress());
  const [todaysTasks, setTodaysTasks] = useState([]);

  // Task submission state
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Initialize AI assistant with user profile
    if (userProfile) {
      aiAssistant.userProfile = userProfile;
    }

    // Load analytics
    const analyticsData = aiAssistant.getLearningAnalytics();
    setAnalytics((prev) => ({ ...prev, ...analyticsData }));

    // Set recommendations to empty array since we removed the AI recommendation generation
    setRecommendations([]);

    // Use provided AI tasks - show all but conditionally enable submit button
    let tasksToSet = [];
    if (aiTasksData && aiTasksData.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      console.log("Loading all tasks. Today end:", today.toISOString());
      
      // Show all pending/in-progress tasks (don't filter by date)
      tasksToSet = aiTasksData.filter(task => {
        const isPending = task.status === 'pending' || task.status === 'in_progress';
        return isPending;
      });
      
      console.log(`Showing ${tasksToSet.length} pending tasks from ${aiTasksData.length} total tasks`);
      
      // Find today's tasks for the separate section
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayTasks = tasksToSet.filter(task => {
        let taskDate = null;
        if (task.scheduledDate) {
          taskDate = new Date(task.scheduledDate);
        } else if (task.dueDate) {
          taskDate = new Date(task.dueDate);
        } else if (task.createdAt) {
          taskDate = new Date(task.createdAt);
        } else {
          taskDate = new Date(now);
        }
        
        if (isNaN(taskDate.getTime())) {
          taskDate = new Date(now);
        }
        
        return taskDate >= todayStart && taskDate <= today;
      });
      
      setTodaysTasks(todayTasks);
    }

    setCurrentTasks(tasksToSet);

    // Sync AI tasks with task service
    if (tasksToSet.length > 0) {
      taskSyncService.syncAITasks(tasksToSet);
    }
  }, [learningData, userProfile, roadmap, dashboardData, aiTasksData]);

  // Listen for task updates from other pages
  useEffect(() => {
    const handleTasksUpdated = async (event) => {
      console.log(
        "Learning Dashboard: Tasks updated from other pages",
        event.detail
      );

      // Refresh analytics when tasks are updated
      const newAnalytics = aiAssistant.getLearningAnalytics();
      setAnalytics((prev) => ({ ...prev, ...newAnalytics }));

      // If an AI task was completed elsewhere, update local state
      if (event.detail?.taskId && event.detail?.action === "completed") {
        setCurrentTasks((tasks) =>
          tasks.map((t) =>
            t.databaseId === event.detail.taskId || t.id === event.detail.taskId
              ? { ...t, status: "completed" }
              : t
          )
        );
      }
    };

    window.addEventListener("tasksUpdated", handleTasksUpdated);

    return () => {
      window.removeEventListener("tasksUpdated", handleTasksUpdated);
    };
  }, []);

  // Update current tasks when aiTasksData changes
  useEffect(() => {
    if (Array.isArray(aiTasksData)) {
      setCurrentTasks(aiTasksData);
    }
  }, [aiTasksData]);

  // Task timer management
  useEffect(() => {
    const interval = setInterval(() => {
      setTaskTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((taskId) => {
          if (updated[taskId].isRunning) {
            updated[taskId].elapsedTime += 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartTask = (taskId) => {
    setTaskTimers((prev) => ({
      ...prev,
      [taskId]: {
        isRunning: true,
        startTime: Date.now(),
        elapsedTime: prev[taskId]?.elapsedTime || 0,
      },
    }));
  };

  const handlePauseResumeTask = (taskId) => {
    setTaskTimers((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isRunning: !prev[taskId]?.isRunning,
      },
    }));
  };

  const handleStopTask = (taskId) => {
    setTaskTimers((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        isRunning: false,
      },
    }));
  };

  const handleAITaskSubmission = async (task, submissionData) => {
    try {
      console.log("Submitting AI task:", task.id, submissionData);

      // Update task status to completed
      const updatedTask = {
        ...task,
        status: "completed",
        submissionType: submissionData.type,
        submissionFile: submissionData.filePath,
        submittedAt: new Date().toISOString(),
        actualTime: taskTimers[task.id]?.elapsedTime / 3600 || 0, // Convert seconds to hours
      };

      // Update local state immediately for responsive UI
      setCurrentTasks((tasks) =>
        tasks.map((t) => (t.id === task.id ? updatedTask : t))
      );

      // Remove from today's tasks if it was there
      setTodaysTasks((tasks) =>
        tasks.map((t) => (t.id === task.id ? updatedTask : t))
      );

      // Stop the timer
      handleStopTask(task.id);

      // Update analytics
      const newAnalytics = aiAssistant.getLearningAnalytics();
      setAnalytics((prev) => ({ ...prev, ...newAnalytics }));

      // Notify parent component to refresh data from backend
      if (onTaskComplete) {
        onTaskComplete(task.id);
      }

      // Update progress
      if (onUpdateProgress) {
        onUpdateProgress();
      }

      // Dispatch event for other components (like TasksPage) to refresh
      window.dispatchEvent(
        new CustomEvent("tasksUpdated", {
          detail: {
            taskId: task.id,
            action: "completed",
            task: updatedTask,
          },
        })
      );

      console.log("AI task submitted successfully:", updatedTask);
      
      // Show success message
      alert("Task submitted successfully! 🎉");
      
    } catch (error) {
      console.error("Error submitting AI task:", error);
      alert("Failed to submit task. Please try again.");
    }
  };

  const handleDeleteGoal = async () => {
    const activeGoal = getActiveGoal();
    if (!activeGoal) {
      alert("No active goal to delete.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the goal "${activeGoal.title}"? This will permanently remove all tasks, progress, and uploaded files related to this goal. This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Delete the goal (this will also delete all related tasks and files on the backend)
      await deleteGoal(activeGoal._id);
      
      // Clear localStorage data related to this goal
      const keysToRemove = [
        'aiLearning_userProfile',
        'aiLearning_roadmap', 
        'aiLearning_learningData',
        'aiLearning_goalData',
        'aiLearning_tasks',
        'aiLearning_progress'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear current component state
      setCurrentTasks([]);
      setAnalytics(null);
      setRecommendations([]);
      setTaskTimers({});
      setTodaysTasks([]);

      alert("Goal and all related data have been successfully deleted.");
      
      // Redirect to assessment page to create a new goal
      window.location.href = "/assessment?new=true";
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete goal. Please try again.");
    }
  };

  const handleCompleteGoal = () => {
    try {
      const completedGoal = completeCurrentGoal();
      console.log("Goal completed:", completedGoal);
      alert("Congratulations! You've completed your learning goal!");
      // You might want to redirect to a completion page or reset the app
    } catch (error) {
      console.error("Error completing goal:", error);
      alert("Failed to complete goal. Please try again.");
    }
  };

  const handleResetGoal = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset your current goal? This will clear all progress."
      )
    ) {
      try {
        resetCurrentGoal();
        setCurrentTasks([]);
        setAnalytics(null);
        setRecommendations([]);
        setTaskTimers({});
        console.log("Goal reset successfully");
        alert("Goal reset successfully. You can start a new learning journey!");
      } catch (error) {
        console.error("Error resetting goal:", error);
        alert("Failed to reset goal. Please try again.");
      }
    }
  };

  // Calculate completion percentage
  const completionPercentage =
    currentTasks.length > 0
      ? Math.round(
          (currentTasks.filter((task) => task.status === "completed").length /
            currentTasks.length) *
            100
        )
      : 0;

  // Calculate total estimated time
  const totalEstimatedTime = currentTasks.reduce(
    (sum, task) => sum + (task.estimatedTime || 0),
    0
  );

  // Calculate total actual time
  const totalActualTime =
    Object.values(taskTimers).reduce(
      (sum, timer) => sum + (timer.elapsedTime || 0),
      0
    ) / 3600;

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Learning Dashboard</h1>
              <p className="text-gray-300">
                Phase {learningData?.currentPhase || 1}, Day{" "}
                {learningData?.dayNumber || 1}
              </p>
            </div>
            <button
              onClick={() => (window.location.href = "/assessment?new=true")}
              className="btn-primary btn-lg"
            >
              + Create New Goal
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-gray-300">Completion</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{currentTasks.length}</div>
              <div className="text-gray-300">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {totalEstimatedTime.toFixed(1)}h
              </div>
              <div className="text-gray-300">Estimated Time</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {totalActualTime.toFixed(1)}h
              </div>
              <div className="text-gray-300">Time Spent</div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Roadmap Progress */}
        {roadmap && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Learning Roadmap</h2>
            <div className="space-y-4">
              {roadmap.phases?.map((phase, index) => (
                <Card key={phase.phase} className="bg-white/10 border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                            learningData?.currentPhase > phase.phase
                              ? "bg-green-500 text-white"
                              : learningData?.currentPhase === phase.phase
                              ? "bg-blue-500 text-white"
                              : "bg-gray-600 text-gray-300"
                          }`}
                        >
                          {learningData?.currentPhase > phase.phase
                            ? "✓"
                            : phase.phase}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-xl">
                            {phase.title}
                          </h3>
                          <p className="text-gray-300">
                            Phase {phase.phase} • {phase.duration} weeks
                          </p>
                        </div>
                      </div>
                      {learningData?.currentPhase === phase.phase && (
                        <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                          Current Phase
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">
                          Topics Covered
                        </h4>
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
                        <h4 className="text-white font-semibold mb-3">
                          Key Projects
                        </h4>
                        <ul className="space-y-2">
                          {phase.projects?.map((project, projectIndex) => (
                            <li
                              key={projectIndex}
                              className="text-gray-300 flex items-center gap-2"
                            >
                              <span className="text-green-400">•</span>
                              {project}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Current Tasks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Current Tasks</h2>
            <div className="flex gap-2">
              <button
                onClick={() => (window.location.href = "/tasks")}
                className="btn-primary btn-md"
              >
                View All Tasks
              </button>
              <button
                onClick={handleDeleteGoal}
                className="btn-danger btn-md"
              >
                Delete Goal
              </button>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="flex flex-wrap gap-4 text-sm mb-6">
            <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/30">
              Total: {currentTasks.length}
            </div>
            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg border border-green-500/30">
              Completed: {currentTasks.filter(task => task.status === 'completed').length}
            </div>
            <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg border border-yellow-500/30">
              Pending: {currentTasks.filter(task => task.status === 'pending').length}
            </div>
            {currentTasks.filter(task => task.isAIGenerated).length > 0 && (
              <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg border border-purple-500/30">
                🤖 AI: {currentTasks.filter(task => task.isAIGenerated).length}
              </div>
            )}
          </div>

          {/* Task List - Similar to Daily Report Table */}
          <div className="space-y-4">
            {currentTasks && currentTasks.length > 0 ? (
              currentTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">
                          {task.title}
                          {task.isAIGenerated && (
                            <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                              🤖 AI
                            </span>
                          )}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getTaskStatusColor(
                            task.status
                          )}`}
                        >
                          {getStatusIcon(task.status)} {task.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Category: {task.category || 'General'}</span>
                        <span>Est. Time: {task.estimatedTime || 1}h</span>
                        {task.phase && <span>Phase: {task.phase}</span>}
                        {taskTimers[task.id] && (
                          <span className="text-cyan-400">
                            Time Spent: {formatTime(taskTimers[task.id].elapsedTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedSubmission(
                            expandedSubmission === task.id ? null : task.id
                          )
                        }
                        className="btn-secondary btn-sm"
                      >
                        {expandedSubmission === task.id ? "Hide" : "Details"}
                      </button>
                      {task.status !== "completed" && (
                        isTaskSubmittable(task) ? (
                          <button
                            onClick={() =>
                              setExpandedSubmission(
                                expandedSubmission === task.id ? null : task.id
                              )
                            }
                            className="btn-primary btn-sm"
                          >
                            🚀 Submit Task
                          </button>
                        ) : (
                          <button
                            disabled
                            className="btn-secondary btn-sm opacity-50 cursor-not-allowed"
                            title="This task is scheduled for a future date"
                          >
                            📅 Future Task
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Expanded Task Details */}
                  {expandedSubmission === task.id && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="space-y-4">
                        {task.description && (
                          <div>
                            <h4 className="font-medium text-white mb-1">
                              📝 Description
                            </h4>
                            <p className="text-sm text-gray-300">
                              {task.description}
                            </p>
                          </div>
                        )}
                        {task.realWorldApplication && (
                          <div>
                            <h4 className="font-medium text-white mb-1">
                              🌍 Real-World Application
                            </h4>
                            <p className="text-sm text-gray-300">
                              {task.realWorldApplication}
                            </p>
                          </div>
                        )}
                        {task.successCriteria && task.successCriteria.length > 0 && (
                          <div>
                            <h4 className="font-medium text-white mb-1">
                              ✅ Success Criteria
                            </h4>
                            <ul className="text-sm text-gray-300 list-disc list-inside">
                              {task.successCriteria.map((criterion, index) => (
                                <li key={index}>{criterion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <ResourceDisplay resources={task.resources} theme="dark" />
                        {task.topics && task.topics.length > 0 && (
                          <div>
                            <h4 className="font-medium text-white mb-1">
                              🏷️ Topics
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {task.topics.map((topic, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}



                        {/* Task Submission */}
                        {task.status !== "completed" && isTaskSubmittable(task) && (
                          <TaskSubmitButton
                            task={task}
                            expandedTask={expandedSubmission}
                            setExpandedTask={setExpandedSubmission}
                            showSubmissionForm={true}
                            onSubmissionComplete={(submissionData) =>
                              handleAITaskSubmission(task, submissionData)
                            }
                          />
                        )}
                        
                        {/* Future Task Message */}
                        {task.status !== "completed" && !isTaskSubmittable(task) && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-blue-400">
                              <span>📅</span>
                              <span className="font-medium">Future Task</span>
                            </div>
                            <p className="text-sm text-gray-300 mt-2">
                              This task is scheduled for a future date. You can view the details but cannot submit it yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">
                  No tasks available
                </h3>
                <p className="text-gray-400 mb-4">
                  Create a new goal to generate AI-powered learning tasks
                </p>
                <button
                  onClick={() => (window.location.href = "/assessment?new=true")}
                  className="btn-primary btn-lg"
                >
                  Create New Goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Learning Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {analytics.totalTasksCompleted || 0}
                  </div>
                  <div className="text-gray-300">Tasks Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {Math.round((analytics.averageEfficiency || 0) * 100)}%
                  </div>
                  <div className="text-gray-300">Efficiency</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {analytics.timeSpentTotal?.toFixed(1) || 0}h
                  </div>
                  <div className="text-gray-300">Total Time</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec, index) => (
                <Card key={index} className="bg-white/10 border-white/20">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{rec.area}</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {rec.suggestion}
                    </p>
                    <div className="text-xs text-gray-400">
                      Expected: {rec.expectedImprovement}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const formatTime = (input) => {
  if (typeof input === "number") {
    const hours = Math.floor(input / 3600);
    const minutes = Math.floor((input % 3600) / 60);
    const seconds = input % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return input;
};

const getTaskStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "in_progress":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "pending":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "completed":
      return "✅";
    case "in_progress":
      return "🔄";
    case "pending":
      return "⏳";
    default:
      return "❓";
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "high":
      return "🔴";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
};

// Helper function to check if a task is submittable (not in future)
const isTaskSubmittable = (task) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  // Check all possible date fields - if ANY is in future, task is not submittable
  const dateFields = [task.scheduledDate, task.dueDate, task.startDate, task.targetDate];
  
  for (const dateField of dateFields) {
    if (dateField) {
      const fieldDate = new Date(dateField);
      if (!isNaN(fieldDate.getTime()) && fieldDate > today) {
        return false; // Not submittable if any date is in future
      }
    }
  }
  
  return true; // Submittable if no future dates found
};
