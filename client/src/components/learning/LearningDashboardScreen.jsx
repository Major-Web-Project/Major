import React, { useState, useEffect } from "react";
import GoalSelector from "../ui/GoalSelector.jsx";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  getGoalProgress,
} from "../../services/aiLearningService";
import { useTasks } from "../../contexts/TasksContext";
import { TaskSubmitButton } from "../tasks/TaskSubmitButton";
import { apiService } from "../../services/api";
import { useGoalStore } from "../../store/goalStore";
import ResourceDisplay from "../tasks/ResourceDisplay.jsx";

// Learning Progress Tracker Helper Functions
const calculateLearningStreak = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  const completedTasks = tasks.filter(task => task.status === 'completed');
  if (completedTasks.length === 0) return 0;

  // Sort by completion date (most recent first)
  const sortedTasks = completedTasks.sort((a, b) =>
    new Date(b.submittedAt || b.updatedAt) - new Date(a.submittedAt || a.updatedAt)
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedTasks.length; i++) {
    const taskDate = new Date(sortedTasks[i].submittedAt || sortedTasks[i].updatedAt);
    taskDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate - taskDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
};

const calculateWeeklyMomentum = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const thisWeekTasks = tasks.filter(task => {
    const taskDate = new Date(task.submittedAt || task.updatedAt || task.createdAt);
    return taskDate >= weekStart;
  });

  const completedThisWeek = thisWeekTasks.filter(task => task.status === 'completed').length;
  const totalThisWeek = thisWeekTasks.length;

  return totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;
};

const calculateSkillProgress = (tasks, roadmap) => {
  if (!tasks || tasks.length === 0 || !roadmap) return 0;

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  if (totalTasks === 0) return 0;

  // Factor in roadmap phases for more accurate skill progress
  const currentPhase = roadmap.phases ? roadmap.phases.length : 1;
  const totalPhases = roadmap.phases ? roadmap.phases.length : 1;
  const phaseWeight = currentPhase / totalPhases;

  const baseProgress = (completedTasks / totalTasks) * 100;
  return Math.round(baseProgress * phaseWeight);
};

const calculateLearningVelocity = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;

  const completedTasks = tasks.filter(task => task.status === 'completed');
  if (completedTasks.length === 0) return 0;

  // Calculate tasks completed in the last 7 days
  const now = new Date();
  const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  const recentCompletions = completedTasks.filter(task => {
    const completionDate = new Date(task.submittedAt || task.updatedAt);
    return completionDate >= weekAgo;
  });

  return recentCompletions.length;
};

// Helper function to calculate completed tasks for a specific phase
const getCompletedTasksForPhase = (goal, phase) => {
  if (!goal || !goal.completedTaskIds || !Array.isArray(goal.completedTaskIds)) return 0;
  
  const phaseEntries = goal.completedTaskIds.filter(entry => entry.phase === phase);
  return phaseEntries.reduce((total, entry) => total + (entry.taskIds ? entry.taskIds.length : 0), 0);
};

// Helper function to calculate completed tasks for a specific topic in a phase
const getCompletedTasksForTopic = (goal, phase, topic) => {
  if (!goal || !goal.completedTaskIds || !Array.isArray(goal.completedTaskIds)) return 0;
  
  const topicEntry = goal.completedTaskIds.find(entry => entry.phase === phase && entry.topic === topic);
  return topicEntry ? (topicEntry.taskIds ? topicEntry.taskIds.length : 0) : 0;
};

// Helper function to get total tasks for a phase (from tasks5D or currentTasks)
const getTotalTasksForPhase = (tasks, phase) => {
  if (!tasks || !Array.isArray(tasks)) return 0;
  return tasks.filter(task => task.phase === phase).length;
};

// Helper function to get total tasks for a topic in a phase
const getTotalTasksForTopic = (tasks, phase, topic) => {
  if (!tasks || !Array.isArray(tasks)) return 0;
  return tasks.filter(task => 
    task.phase === phase && 
    task.topics && 
    Array.isArray(task.topics) && 
    task.topics.includes(topic)
  ).length;
};

const generateWeeklyGoals = (tasks, roadmap) => {
  const goals = [];
  
  // Goal 1: Complete daily tasks
  const todaysTasks = tasks.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.scheduledDate || task.createdAt);
    return taskDate.toDateString() === today.toDateString();
  });
  const todaysCompleted = todaysTasks.filter(task => task.status === 'completed').length;
  const todaysProgress = todaysTasks.length > 0 ? Math.round((todaysCompleted / todaysTasks.length) * 100) : 0;
  
  goals.push({
    title: "Complete today's tasks",
    progress: todaysProgress,
    completed: todaysProgress === 100
  });
  
  // Goal 2: Maintain learning streak
  const streak = calculateLearningStreak(tasks);
  goals.push({
    title: "Maintain learning streak",
    progress: Math.min(streak * 20, 100), // 5 days = 100%
    completed: streak >= 5
  });
  
  // Goal 3: Phase progression
  if (roadmap && roadmap.phases) {
    const currentPhase = roadmap.phases[0] || {};
    
    // Calculate actual phase progress based on completed tasks
    const phaseTasks = tasks.filter(task => 
      task.phase === currentPhase.phase || 
      (task.category && task.category.toLowerCase().includes(currentPhase.title?.toLowerCase().split(' ')[0] || ''))
    );
    const completedPhaseTasks = phaseTasks.filter(task => task.status === 'completed');
    const phaseProgress = phaseTasks.length > 0 ? Math.round((completedPhaseTasks.length / phaseTasks.length) * 100) : 0;
    
    goals.push({
      title: `Progress in ${currentPhase.title || 'Current Phase'}`,
      progress: phaseProgress,
      completed: phaseProgress === 100
    });
  }
  
  return goals;
};

const generateLearningInsights = (tasks, roadmap, learningData) => {
  const insights = [];
  
  // Insight 1: Learning pace
  const velocity = calculateLearningVelocity(tasks);
  if (velocity > 5) {
    insights.push({
      icon: "🚀",
      title: "Excellent Learning Pace",
      description: `You're completing ${velocity} tasks per week - keep it up!`
    });
  } else if (velocity > 2) {
    insights.push({
      icon: "📈",
      title: "Steady Progress",
      description: `${velocity} tasks per week is a solid pace for consistent learning.`
    });
  } else {
    insights.push({
      icon: "💡",
      title: "Room for Acceleration",
      description: "Consider increasing your daily study time to boost progress."
    });
  }
  
  // Insight 2: Streak motivation
  const streak = calculateLearningStreak(tasks);
  if (streak > 7) {
    insights.push({
      icon: "🔥",
      title: "Streak Master",
      description: `${streak} days of consistent learning! You're building great habits.`
    });
  } else if (streak > 0) {
    insights.push({
      icon: "⭐",
      title: "Building Momentum",
      description: `${streak} day streak - aim for 7 days to establish a strong routine.`
    });
  }
  
  // Insight 3: Phase-specific advice
  if (roadmap && roadmap.phases && learningData) {
    const currentPhase = learningData.currentPhase || 1;
    const phase = roadmap.phases.find(p => p.phase === currentPhase);
    if (phase) {
      insights.push({
        icon: "🎯",
        title: `Phase ${currentPhase} Focus`,
        description: `Currently mastering: ${phase.topics ? phase.topics.slice(0, 2).join(', ') : 'core concepts'}`
      });
    }
  }
  
  return insights.slice(0, 4); // Limit to 4 insights
};

const generateSkillProgression = (tasks, roadmap, taskStatistics) => {
  const skills = [];

  if (!roadmap || !roadmap.phases) {
    // Default skills if no roadmap
    return [
      {
        name: "Foundation",
        level: "Beginner",
        progress: 45,
        color: "bg-blue-400",
        tasksCompleted: 3,
        totalTasks: 8
      },
      {
        name: "Practical Skills",
        level: "Learning",
        progress: 20,
        color: "bg-yellow-400",
        tasksCompleted: 1,
        totalTasks: 5
      },
      {
        name: "Advanced Topics",
        level: "Not Started",
        progress: 0,
        color: "bg-gray-400",
        tasksCompleted: 0,
        totalTasks: 6
      }
    ];
  }
  
  // Generate skills based on roadmap phases using AI task statistics
  roadmap.phases.forEach((phase, index) => {
    // Use the same function as the phase section to get accurate statistics
    const phaseStats = getAITaskStatsForPhase(taskStatistics, phase.phase);
    const progress = phaseStats.total > 0 ? Math.round((phaseStats.completed / phaseStats.total) * 100) : 0;
    
    let level = "Not Started";
    let color = "bg-gray-400";
    
    if (progress > 80) {
      level = "Advanced";
      color = "bg-green-400";
    } else if (progress > 50) {
      level = "Intermediate";
      color = "bg-blue-400";
    } else if (progress > 20) {
      level = "Learning";
      color = "bg-yellow-400";
    } else if (progress > 0) {
      level = "Beginner";
      color = "bg-orange-400";
    }
    
    skills.push({
      name: phase.title || `Phase ${phase.phase}`,
      level,
      progress,
      color,
      tasksCompleted: phaseStats.completed,
      totalTasks: phaseStats.total
    });
  });
  
  return skills.slice(0, 6); // Limit to 6 skills for better display
};

// Helper function to get AI task statistics for a specific phase
const getAITaskStatsForPhase = (taskStatistics, phaseNumber) => {
  if (!taskStatistics?.byPhase) {
    return { completed: 0, total: 0 };
  }
  
  // Always look up using string key for consistency
  const phaseKey = String(phaseNumber);
  const phaseStats = taskStatistics.byPhase[phaseKey];
  
  if (!phaseStats) {
    // No stats found for this phase
  }
  
  return phaseStats ? { completed: phaseStats.completed, total: phaseStats.total } : { completed: 0, total: 0 };
};

// NEW: Robust helper function to get topic-wise task statistics using actual database structure
const getTopicTaskStats = (taskStatistics, phaseNumber, topicIndex) => {
  // Validate inputs and check if we have task data
  if (!taskStatistics?.allTasks || !Array.isArray(taskStatistics.allTasks)) {
    return { completed: 0, total: 0, hasData: false };
  }

  // Ensure we have valid phase and topic identifiers
  if (phaseNumber === undefined || phaseNumber === null || topicIndex === undefined || topicIndex === null) {
    return { completed: 0, total: 0, hasData: false };
  }

  // CRITICAL FIX: Convert 1-based phase number to 0-based for database comparison
  // Database stores aiMetadata.phase and aiMetadata.topic as 0-based indices
  // But roadmap.phases use 1-based phase numbers (1, 2, 3...)
  const dbPhaseIndex = Number(phaseNumber) - 1; // Convert 1-based to 0-based
  const dbTopicIndex = Number(topicIndex); // topicIndex is already 0-based array index

  // Filter tasks based on actual database structure
  // Task model has: aiMetadata.phase (Number, 0-based) and aiMetadata.topic (Number, 0-based)
  const topicTasks = taskStatistics.allTasks.filter(task => {
    // Handle both direct properties and nested aiMetadata
    const taskPhase = task.aiMetadata?.phase ?? task.phase;
    const taskTopic = task.aiMetadata?.topic ?? task.topic;
    
    // Ensure type consistency - both should be numbers
    const normalizedTaskPhase = Number(taskPhase);
    const normalizedTaskTopic = Number(taskTopic);
    
    // Match both phase and topic using 0-based indices
    const phaseMatch = normalizedTaskPhase === dbPhaseIndex;
    const topicMatch = normalizedTaskTopic === dbTopicIndex;
    
    return phaseMatch && topicMatch;
  });

  // Count completed tasks
  const completedTasks = topicTasks.filter(task => {
    // Handle various completion status formats
    const status = task.status?.toLowerCase?.() || '';
    return status === 'completed';
  });

  return {
    completed: completedTasks.length,
    total: topicTasks.length,
    hasData: topicTasks.length > 0,
    // Additional debug info for troubleshooting
    debug: {
      phaseNumber: Number(phaseNumber),
      topicIndex: Number(topicIndex),
      dbPhaseIndex,
      dbTopicIndex,
      matchedTasks: topicTasks.length,
      sampleTask: topicTasks[0] || null
    }
  };
};

// Helper function to get AI tasks for a specific phase from aiTasks array
const getAITasksForPhase = (aiTasks, phaseNumber) => {
  if (!aiTasks || !Array.isArray(aiTasks)) return [];
  return aiTasks.filter(task => task.aiMetadata?.phase === phaseNumber);
};

// Helper function to get AI tasks for a specific topic from aiTasks array
const getAITasksForTopic = (aiTasks, topicName) => {
  if (!aiTasks || !Array.isArray(aiTasks)) return [];
  return aiTasks.filter(task => task.aiMetadata?.topic === topicName);
};

export const LearningDashboardScreen = ({
  learningData,
  // userProfile removed
  roadmap,
  selectedGoal,
  dashboardData,
  aiTasksData,
  taskStatistics,
  aiTasks,
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
  const [roadmapPhases, setRoadmapPhases] = useState([]);

  // Task submission state
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Initialize AI assistant with user profile
  // userProfile logic removed

    // Load analytics - placeholder since aiAssistant removed
    // const analyticsData = aiAssistant.getLearningAnalytics();
    // setAnalytics((prev) => ({ ...prev, ...analyticsData }));

    // Set recommendations to empty array since we removed the AI recommendation generation
    setRecommendations([]);

    // Use provided AI tasks - show all but conditionally enable submit button
    let tasksToSet = [];
    if (aiTasksData && aiTasksData.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      // Show all pending/in-progress tasks (don't filter by date)
      tasksToSet = aiTasksData.filter(task => {
        const isPending = task.status === 'pending' || task.status === 'in_progress';
        return isPending;
      });
      
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

  // Removed leftover automatic AI task sync to prevent unnecessary backend calls and validation errors
  }, [learningData, roadmap, dashboardData, aiTasksData]);

  // Initialize roadmap phases with expandedTopicIdx
  useEffect(() => {
    if (roadmap && roadmap.phases) {
      setRoadmapPhases(
        roadmap.phases.map((phase) => ({ ...phase, showAllResources: false, expandedTopicIdx: null }))
      );
    }
  }, [roadmap]);

  // Listen for task updates from other pages
  useEffect(() => {
    const handleTasksUpdated = async (event) => {
      // Refresh analytics when tasks are updated - placeholder since aiAssistant removed
      // const newAnalytics = aiAssistant.getLearningAnalytics();
      // setAnalytics((prev) => ({ ...prev, ...newAnalytics }));

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

      // If new tasks were generated, refresh the entire task list
      if (event.detail?.action === "tasksGenerated" || event.detail?.action === "newTasksAdded") {
        // Refresh dashboard after task generation
        
        // Get the active goal to refresh tasks
        const activeGoal = getActiveGoal();
        if (activeGoal && activeGoal._id) {
          try {
            // Refresh tasks using TasksContext instead of aiAssistant
            await refreshTasks(activeGoal._id);
            // Tasks refreshed successfully after generation
          } catch (error) {
            // Handle task refresh error silently
          }
        }
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


  const handleDeleteGoal = async () => {
    const activeGoal = getActiveGoal();
    if (!activeGoal) {
      alert("No active goal to delete.");
      return;
    }

    // Get goal name with fallbacks and better error handling
    let goalName = 'this goal';
    
    if (activeGoal.field && typeof activeGoal.field === 'string' && activeGoal.field.trim()) {
      goalName = activeGoal.field.trim();
    } else if (activeGoal.title && typeof activeGoal.title === 'string' && activeGoal.title.trim()) {
      goalName = activeGoal.title.trim();
    } else if (activeGoal.description && typeof activeGoal.description === 'string' && activeGoal.description.trim()) {
      goalName = activeGoal.description.trim().substring(0, 50) + '...';
    }
    
  // Debug log for active goal for deletion removed

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the goal "${goalName}"? This will permanently remove all tasks, progress, and uploaded files related to this goal. This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Delete the goal (this will also delete all related tasks and files on the backend)
      await deleteGoal(activeGoal._id);
      
      // Clear localStorage data related to this goal
      const keysToRemove = [
  // 'aiLearning_userProfile' removed
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
      
      // Redirect to dashboard page
      window.location.href = "/dashboard";
    } catch (error) {
      alert("Failed to delete goal. Please try again.");
    }
  };

  const handleCompleteGoal = () => {
    try {
  // completeCurrentGoal removed
      alert("Congratulations! You've completed your learning goal!");
      // You might want to redirect to a completion page or reset the app
    } catch (error) {
      alert("Failed to complete goal. Please try again.");
    }
  };

  // handleResetGoal removed (resetCurrentGoal no longer used)

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
      <div className="container mx-auto px-4 py-8">{/* Removed temporary debug logs - core issue fixed: phase/topic index mismatch */}
        {/* Unified Header with Goal Selector between buttons */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Learning Dashboard</h1>
              <p className="text-gray-300">
                Phase {learningData?.currentPhase || 1}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center justify-end">
              <button
                onClick={() => (window.location.href = "/tasks")}
                className="btn-secondary btn-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                View All Tasks
              </button>
            
              <GoalSelector />
              <button
                onClick={() => (window.location.href = "/assessment?new=true")}
                className="btn-primary btn-lg"
              >
                + Create New Goal
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{taskStatistics?.overall?.completionPercentage ? (taskStatistics.overall.completionPercentage).toFixed(1) : '0.0'}%</div>
              <div className="text-gray-300">Completion</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{taskStatistics?.overall?.total || 0}</div>
              <div className="text-gray-300">Total Tasks</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{taskStatistics?.overall?.completed || 0}/{taskStatistics?.overall?.total || 0}</div>
              <div className="text-gray-300">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {totalEstimatedTime.toFixed(1)}h
              </div>
              <div className="text-gray-300">Estimated Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Progress Tracker */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Learning Progress Tracker</h2>
          </div>

          {/* Learning Streak & Momentum */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-2xl font-bold text-orange-400">
                  {calculateLearningStreak(currentTasks)}
                </div>
                <div className="text-gray-300 text-sm">Day Streak</div>
              </CardContent>
            </Card>

            <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {calculateWeeklyMomentum(currentTasks)}%
                </div>
                <div className="text-gray-300 text-sm">Weekly Momentum</div>
              </CardContent>
            </Card>

            <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-green-400">
                  {calculateSkillProgress(currentTasks, roadmap)}%
                </div>
                <div className="text-gray-300 text-sm">Skill Progress</div>
              </CardContent>
            </Card>

            <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">📈</div>
                <div className="text-2xl font-bold text-blue-400">
                  {calculateLearningVelocity(currentTasks)}
                </div>
                <div className="text-gray-300 text-sm">Tasks/Week</div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Learning Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Weekly Learning Goals
                </h3>
                <div className="space-y-4">
                  {generateWeeklyGoals(currentTasks, roadmap).map((goal, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${goal.completed ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                        <span className="text-gray-300">{goal.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${goal.completed ? 'bg-green-400' : 'bg-blue-400'}`}
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">{goal.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>🧠</span>
                  Learning Insights
                </h3>
                <div className="space-y-3">
                  {generateLearningInsights(currentTasks, roadmap, learningData).map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <span className="text-lg">{insight.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{insight.title}</div>
                        <div className="text-xs text-gray-400">{insight.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Progression Visualization */}
          <Card className="bg-[#181D24]border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🚀</span>
                Skill Progression
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generateSkillProgression(currentTasks, roadmap, taskStatistics).map((skill, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{skill.name}</span>
                      <span className="text-sm text-gray-400">{skill.level}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${skill.color}`}
                        style={{ width: `${skill.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {skill.tasksCompleted} of {skill.totalTasks} tasks completed
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Roadmap Progress */}
        {roadmap && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Learning Roadmap</h2>
            <div className="space-y-6">
              {roadmapPhases.map((phase, phaseIdx) => (
                <Card key={phase.phase} className="!bg-[#181D24] backdrop-blur-md border !border-gray-700 rounded-3xl shadow-2xl mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${learningData?.currentPhase === phase.phase
                            ? "bg-cyan-500 text-white"
                            : learningData?.currentPhase > phase.phase
                              ? "bg-green-500 text-white"
                              : "bg-gray-600 text-gray-300"}`}
                        >
                          {learningData?.currentPhase > phase.phase ? "✓" : phase.phase}
                        </div>
                        <div>
                          <h4 className="text-indigo-700 font-bold text-xl dark:text-white">{phase.title}</h4>
                          <p className="text-sky-700 dark:text-gray-300">
                            Phase {phase.phase} • {phase.duration} {phase.duration === 1 ? 'month' : 'months'}
                            {(() => {
                              const aiPhaseStats = getAITaskStatsForPhase(taskStatistics, phase.phase);
                              const hasAIStats = aiPhaseStats.total > 0;
                              const fallbackCompleted = selectedGoal ? getCompletedTasksForPhase(selectedGoal, phase.phase) : 0;
                              const fallbackTotal = getTotalTasksForPhase(currentTasks, phase.phase);
                              
                              return (
                                <span className="ml-2 text-green-400 font-semibold">
                                  ({hasAIStats ? aiPhaseStats.completed : fallbackCompleted} / {hasAIStats ? aiPhaseStats.total : fallbackTotal} tasks completed)
                                </span>
                              );
                            })()}
                          </p>
                        </div>
                      </div>
                      {phase.adjustedForUser && (
                        <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                          <span className="text-purple-400 text-sm font-semibold">AI Adjusted</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">Topics Covered</h5>
                        <div className="flex flex-wrap gap-2">
                          {phase.topics?.map((topic, topicIndex) => {
  // Support both string and object topic formats
  const topicTitle = typeof topic === 'object' && topic !== null ? topic.title : topic;
  const topicSubtopics = typeof topic === 'object' && topic !== null ? topic.subtopics : undefined;
  const topicResources = typeof topic === 'object' && topic !== null && Array.isArray(topic.resources) ? topic.resources : [];
  const isExpanded = phase.expandedTopicIdx === topicIndex;
  const handleExpand = () => {
    setRoadmapPhases(prevPhases => prevPhases.map((p, idx) =>
      idx === phaseIdx ? { ...p, expandedTopicIdx: isExpanded ? null : topicIndex } : p
    ));
  };
  return (
    <div
      key={topicIndex}
      className={`w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-sm border border-blue-400/30 break-words whitespace-normal mb-2 cursor-pointer transition-all duration-300 ${isExpanded ? 'shadow-2xl scale-105 z-20 border-2 border-cyan-400 bg-blue-900/40' : ''}`}
      style={{ wordBreak: 'break-word', whiteSpace: 'normal', position: 'relative' }}
      onClick={handleExpand}
    >
      <div className="flex items-center justify-between">
        <div>
          <strong className="text-lg text-white">{topicTitle || ''}</strong>
          {topicSubtopics && Array.isArray(topicSubtopics) && (
            <span className="ml-2 text-blue-300">{topicSubtopics.join(", ")}</span>
          )}
          {(() => {
            // NEW: Use robust topic task statistics with comprehensive data validation
            const topicStats = getTopicTaskStats(taskStatistics, phase.phase, topicIndex);
            

            
            // Only show stats if we have actual task data for this topic
            if (topicStats.hasData && topicStats.total > 0) {
              const completionPercentage = topicStats.total > 0 
                ? Math.round((topicStats.completed / topicStats.total) * 100) 
                : 0;
              
              return (
                <div className="text-sm text-green-400 font-semibold mt-1">
                  <div className="flex items-center gap-2">
                    <span>{topicStats.completed} / {topicStats.total} tasks completed</span>
                    <span className="text-xs text-blue-300">({completionPercentage}%)</span>
                  </div>
                </div>
              );
            }
            // No tasks found for this topic - show nothing (clean UI)
            return null;
          })()}
        </div>
        {isExpanded ? (
          <span className="ml-4 text-cyan-400 font-bold">▲</span>
        ) : (
          <span className="ml-4 text-cyan-400 font-bold">▼</span>
        )}
      </div>
      {isExpanded && (
        <div className="mt-4 p-4 bg-white/10 rounded-2xl border-2 border-cyan-400 shadow-xl transition-all duration-300">
          <h6 className="text-indigo-400 font-bold mb-3 text-lg dark:text-white">Resources</h6>
          {topicResources.length > 0 ? (
            <ul className="space-y-3">
              {topicResources.map((resource, resIdx) => (
                <li key={resIdx} className="text-gray-100 dark:text-gray-200 text-base">
                  <span className="font-bold text-blue-400">[{resource.type}]</span> <span className="font-semibold">{resource.title}</span> - <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">{resource.url}</a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 italic">No resources available for this topic.</div>
          )}
        </div>
      )}
    </div>
  );
})}
                      </div>
                      </div>
                      {/* Close topics column */}
                      <div>
                      <div>
                        <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">Key Projects</h5>
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
                        {/* Topic-level Resource Expansion: see resources by clicking a topic */}
                        {/* This replaces the old phase-wide resource section */}
                      </div>
                    </div>
                    {/* Close grid-cols-2 */}
                  </div>
                  {/* End grid-cols-2 wrapper */}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {analytics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Learning Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {analytics.totalTasksCompleted || 0}
                  </div>
                  <div className="text-gray-300">Tasks Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">
                    {Math.round((analytics.averageEfficiency || 0) * 100)}%
                  </div>
                  <div className="text-gray-300">Efficiency</div>
                </CardContent>
              </Card>
              <Card className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
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
                <Card key={index} className="bg-[#181D24] border-sky-200/50 dark:bg-gray-800/60 dark:border-gray-700/50">
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

        {/* Delete Goal Button - Bottom Right */}
        <div className="flex justify-end mt-12 mb-8">
          <button
            onClick={handleDeleteGoal}
            className="btn-danger btn-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Goal
          </button>
        </div>
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