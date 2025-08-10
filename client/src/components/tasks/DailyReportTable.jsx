import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { useTasks } from "../../contexts/TasksContext";
import { utcToLocalDateString } from "../../utils/dateUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CategoryTaskCards } from "./CategoryTaskCards";
import { TaskSubmitButton } from "./TaskSubmitButton";
import AnimatedTitle from "../ui/AnimatedTitle.jsx";

const SPOTLIGHT_TEXT = "Daily Tasks";

export const DailyReportTable = ({
  onTaskCreated,
  selectedDate,
  onDateSelect,
  aiTasks = [],
  learningData,
  userProfile,
}) => {
  const { createTask, refreshTasks, viewTaskSubmission, getTasksByDate } =
    useTasks();
  const [expandedTask, setExpandedTask] = useState(null);
  const [submissionTask, setSubmissionTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showCategoryView, setShowCategoryView] = useState(false);
  const [combinedTasks, setCombinedTasks] = useState([]);

  const [newTaskForm, setNewTaskForm] = useState({
    name: "",
    status: "pending",
    priority: "medium",
    notes: "",
    estimatedTime: "",
    type: "assignment",
  });

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
      const tasks = await getTasksByDate(selectedDate);
      setCombinedTasks(tasks);
    }
    fetchTasks();
  }, [selectedDate, getTasksByDate]);

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

  const handleAddTask = async () => {
    if (!newTaskForm.name.trim()) {
      alert("Please enter a task name");
      return;
    }

    try {
      const taskData = {
        goalId: userProfile?.currentGoalId, // This would need to be passed from parent
        title: newTaskForm.name,
        description: newTaskForm.notes,
        type: newTaskForm.type,
        category: "General",
        priority: newTaskForm.priority,
        estimatedTime: parseFloat(newTaskForm.estimatedTime) || 1,
        scheduledDate: selectedDate,
        status: "pending",
        isAIGenerated: false,
      };

      await createTask(taskData);
      setNewTaskForm({
        name: "",
        status: "pending",
        priority: "medium",
        notes: "",
        estimatedTime: "",
        type: "assignment",
      });
      setShowAddTask(false);
      onTaskCreated?.();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleTaskSubmissionComplete = async () => {
    setSubmissionTask(null);
    await refreshTasks();
    onTaskCreated?.();
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
        <AnimatedTitle text={SPOTLIGHT_TEXT} fontSize="48px" fontWeight="900" />
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
          onClick={() => setShowAddTask(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Add Task
        </Button>
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
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Add New Task
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task name"
                value={newTaskForm.name}
                onChange={(e) =>
                  setNewTaskForm({ ...newTaskForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newTaskForm.notes}
                onChange={(e) =>
                  setNewTaskForm({ ...newTaskForm, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="3"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newTaskForm.priority}
                  onChange={(e) =>
                    setNewTaskForm({ ...newTaskForm, priority: e.target.value })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input
                  type="number"
                  placeholder="Hours"
                  value={newTaskForm.estimatedTime}
                  onChange={(e) =>
                    setNewTaskForm({
                      ...newTaskForm,
                      estimatedTime: e.target.value,
                    })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleAddTask}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Add Task
              </Button>
              <Button
                onClick={() => setShowAddTask(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
                {isTodayDate(selectedDate)
                  ? "Add a task to get started with your day!"
                  : "No tasks scheduled for this date."}
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
                        {task.isAIGenerated && (
                          <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">
                            🤖 AI
                          </span>
                        )}
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
                    {/* Only show submit button for today's tasks in expanded view */}
                    {isTodayDate(selectedDate) &&
                      task.status !== "completed" && (
                        <Button
                          onClick={() =>
                            setExpandedTask(
                              expandedTask === task.id ? null : task.id
                            )
                          }
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-sm"
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
                      {task.resources && task.resources.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            📚 Learning Resources
                          </h4>
                          <ul className="text-sm text-gray-600 dark:text-gray-300">
                            {task.resources.map((resource, index) => (
                              <li key={index}>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  {resource.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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

                      {/* Submission Form - Only show for today's tasks */}
                      {isTodayDate(selectedDate) &&
                        task.status !== "completed" && (
                          <TaskSubmitButton
                            task={task}
                            expandedTask={expandedTask}
                            setExpandedTask={setExpandedTask}
                            showSubmissionForm={true}
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
