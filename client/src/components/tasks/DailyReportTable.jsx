import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { useTasks } from "../../contexts/TasksContext";
import { useGoalStore } from "../../store/goalStore.js";
import { utcToLocalDateString } from "../../utils/dateUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CategoryTaskCards } from "./CategoryTaskCards";
import { TaskSubmitButton } from "./TaskSubmitButton";
import AnimatedTitle from "../ui/AnimatedTitle.jsx";
import ResourceDisplay from "./ResourceDisplay.jsx";

const SPOTLIGHT_TEXT = "Daily Tasks";

export const DailyReportTable = ({
  selectedDate,
  onDateSelect,
  aiTasks = [],
  learningData,
  userProfile,
  onTaskComplete,
}) => {
  const { refreshTasks, viewTaskSubmission, getTasksByDate } =
    useTasks();
  const { activeGoalId } = useGoalStore();
  const [expandedTask, setExpandedTask] = useState(null);
  const [submissionTask, setSubmissionTask] = useState(null);
  const [showCategoryView, setShowCategoryView] = useState(false);
  const [combinedTasks, setCombinedTasks] = useState([]);

  // Typewriter animation state
  const container = useRef();
  const [typed, setTyped] = useState("");
  const [spotlightPos, setSpotlightPos] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // IntersectionObserver to trigger and reset typewriter
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          setIsInView(false);
          setTyped("");
          setIsDone(false);
          setSpotlightPos(0);
        }
      },
      { threshold: 0.3 }
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!isInView) return;
    if (typed.length < SPOTLIGHT_TEXT.length) {
      const timeout = setTimeout(() => {
        setTyped(SPOTLIGHT_TEXT.slice(0, typed.length + 1));
        setSpotlightPos(typed.length + 1);
      }, 60);
      return () => clearTimeout(timeout);
    } else if (typed.length === SPOTLIGHT_TEXT.length) {
      setIsDone(true);
    }
  }, [typed, isInView]);

  // Fetch tasks for selected date from backend
  useEffect(() => {
    async function fetchTasks() {
      if (!selectedDate) {
        setCombinedTasks([]);
        return;
      }
      
      // Only fetch if we have an active goal - strict filtering
      if (!activeGoalId) {
        console.log(`[DailyReportTable] No active goal selected, showing empty task list`);
        setCombinedTasks([]);
        return;
      }
      
      console.log(`[DailyReportTable] Fetching tasks for date ${selectedDate.toDateString()} with goalId: ${activeGoalId}`);
      const tasks = await getTasksByDate(selectedDate, activeGoalId);
      
      // Double-check: filter out any tasks that don't belong to the active goal
      const filteredTasks = tasks.filter(task => {
        const taskGoalId = task.goal?._id || task.goal;
        const belongsToActiveGoal = taskGoalId === activeGoalId;
        if (!belongsToActiveGoal && taskGoalId) {
          console.warn(`[DailyReportTable] Filtering out task "${task.name}" - belongs to goal ${taskGoalId}, not ${activeGoalId}`);
        }
        return belongsToActiveGoal || !taskGoalId; // Include legacy tasks without goal
      });
      
      console.log(`[DailyReportTable] Found ${tasks.length} tasks, filtered to ${filteredTasks.length} for goalId: ${activeGoalId}`);
      setCombinedTasks(filteredTasks);
    }
    fetchTasks();
  }, [selectedDate, activeGoalId, getTasksByDate]);

  // Helper functions
  const formatLocalDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-yellow-100/80 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30";
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
        return "bg-yellow-100/80 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30";
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

  // Helper to check if a date is today
  const isTodayDate = (date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };



  const handleTaskSubmissionComplete = async (taskId) => {
    setSubmissionTask(null);
    await refreshTasks();
    
    // Call the parent callback to refresh AI tasks data
    if (onTaskComplete) {
      await onTaskComplete(taskId);
    }
  };

  const handleViewSubmission = async (taskId) => {
    try {
      const submission = await viewTaskSubmission(taskId);
      setSubmissionTask({ taskId, submission });
    } catch (error) {
      console.error("Error viewing submission:", error);
      alert("Failed to load submission. Please try again.");
    }
  };

  // Calculate spotlight position in px (estimate per char)
  const charWidth = 22; // px, adjust for font-size
  const spotlightX = 32 + (spotlightPos - 1) * charWidth;

  // Spotlight mask style
  const maskStyle = !isDone
    ? {
        WebkitMaskImage: `radial-gradient(circle 38px at ${spotlightX}px 50%, white 80%, transparent 100%)`,
        maskImage: `radial-gradient(circle 38px at ${spotlightX}px 50%, white 80%, transparent 100%)`,
        transition: "WebkitMaskImage 0.1s, maskImage 0.1s",
      }
    : {};

  // Calculate summary statistics
  const totalTasks = combinedTasks.length;
  const completedTasks = combinedTasks.filter(
    (task) => task.status === "completed"
  ).length;
  const pendingTasks = combinedTasks.filter(
    (task) => task.status === "pending"
  ).length;
  const aiGeneratedTasks = combinedTasks.filter(
    (task) => task.isAIGenerated
  ).length;

  return (
    <div className="bg-mint-100 border border-mint-200 rounded-3xl shadow-2xl dark:bg-white/10 dark:border-white/20 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <AnimatedTitle text={SPOTLIGHT_TEXT} fontSize="48px" fontWeight="900" />
          {activeGoalId && (
            <p className="text-gray-400 text-sm mt-2">
              🎯 Showing tasks for your active goal only
            </p>
          )}
        </div>
      </div>

      {/* Date Selection and Summary */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => onDateSelect(date)}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="MMMM d, yyyy"
          />
          {isTodayDate(selectedDate) && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Today
            </span>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg">
            Total: {totalTasks}
          </div>
          <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg">
            Completed: {completedTasks}
          </div>
          <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg">
            Pending: {pendingTasks}
          </div>
          {aiGeneratedTasks > 0 && (
            <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-lg">
              🤖 AI: {aiGeneratedTasks}
            </div>
          )}
        </div>
      </div>

      {/* Task Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button
          onClick={() => setShowCategoryView(!showCategoryView)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            showCategoryView
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          }`}
        >
          {showCategoryView ? "List View" : "Category View"}
        </Button>
        
        <Button
          onClick={async () => {
            try {
              const response = await fetch('/api/tasks/create-test-task', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include'
              });
              const data = await response.json();
              if (data.success) {
                alert('Test task created! Refresh the page to see it.');
                window.location.reload();
              } else {
                alert('Failed to create test task: ' + data.message);
              }
            } catch (error) {
              alert('Error creating test task: ' + error.message);
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          🧪 Create Test Task with Resources
        </Button>
        

      </div>



      {/* Task List */}
      {showCategoryView ? (
        <CategoryTaskCards tasks={combinedTasks} />
      ) : (
        <div className="space-y-4">
          {combinedTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No tasks for {selectedDate.toLocaleDateString()}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {activeGoalId ? (
                  <>
                    {isTodayDate(selectedDate)
                      ? "No tasks scheduled for your active goal today."
                      : "No tasks scheduled for your active goal on this date."}
                    <br />
                    <span className="text-blue-400">Try switching goals or creating new tasks.</span>
                  </>
                ) : (
                  isTodayDate(selectedDate)
                    ? "Add a task to get started with your day!"
                    : "No tasks scheduled for this date."
                )}
              </p>
            </div>
          ) : (
            combinedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task.title || task.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
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
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Category: {task.category}</span>
                      <span>Est. Time: {task.estimatedTime}h</span>
                      {task.phase && <span>Phase: {task.phase}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        setExpandedTask(
                          expandedTask === task.id ? null : task.id
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      {expandedTask === task.id ? "Hide" : "Details"}
                    </Button>
                    
                    {/* Show submit button for today's tasks, but hide when submission form is open */}
                    {isTodayDate(selectedDate) &&
                      task.status !== "completed" && 
                      expandedTask !== task.id && (
                        <Button
                          onClick={() =>
                            setExpandedTask(task.id)
                          }
                          className="btn-primary btn-sm"
                        >
                          🚀 Submit Task
                        </Button>
                      )}

                    {!isTodayDate(selectedDate) && (
                      <Button
                        disabled
                        className="bg-gray-400 text-white text-sm cursor-not-allowed opacity-60"
                      >
                        {selectedDate > new Date()
                          ? "Future Task"
                          : "Past Task"}
                      </Button>
                    )}
                  </div>
                </div>
                {/* Expanded Task Details - always show all available fields */}
                {expandedTask === task.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      {task.description && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            📝 Description
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {task.description}
                          </p>
                        </div>
                      )}
                      {task.realWorldApplication && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            🌍 Real-World Application
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {task.realWorldApplication}
                          </p>
                        </div>
                      )}
                      {task.successCriteria &&
                        task.successCriteria.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              ✅ Success Criteria
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside">
                              {task.successCriteria.map((criterion, index) => (
                                <li key={index}>{criterion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      <ResourceDisplay resources={task.resources || task.data?.resources} />
                      {task.topics && task.topics.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            🏷️ Topics
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {task.topics.map((topic, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task Submit/View Button - Show for today's tasks */}
                      {isTodayDate(selectedDate) && (
                        <TaskSubmitButton
                          task={task}
                          expandedTask={expandedTask}
                          setExpandedTask={setExpandedTask}
                          showSubmissionForm={task.status !== "completed"}
                          onSubmissionComplete={handleTaskSubmissionComplete}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Submission Modal */}
      {submissionTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Task Submission
            </h3>
            <div className="space-y-4">
              {submissionTask.submission?.data?.fileUrl ? (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Submitted File
                  </h4>
                  <a
                    href={submissionTask.submission.data.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    View Submission
                  </a>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  No submission file found.
                </p>
              )}
            </div>
            <Button
              onClick={() => setSubmissionTask(null)}
              className="mt-6 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
