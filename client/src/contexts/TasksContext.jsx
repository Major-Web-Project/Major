import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { apiService } from "../services/api";
import { utcToLocalDateString } from "../utils/dateUtils";

const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskStatistics, setTaskStatistics] = useState(null);

  // Normalize task object to ensure consistent structure
  const normalizeTask = useCallback((task) => {
    const taskData = task.data || {};
    return {
      id: task._id || task.id,
      name: taskData.name || task.name || task.title || "Untitled Task",
      title: taskData.title || task.title || task.name || "Untitled Task",
      description: taskData.description || task.description,
      status: taskData.status || task.status || "pending",
      priority: taskData.priority || task.priority || "medium",
      notes: taskData.notes || task.notes,
      estimatedTime: taskData.estimatedTime || task.estimatedTime,
      completionTime: taskData.completionTime || task.completionTime,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      submissionType: taskData.submissionType || task.submissionType,
      submissionFile: taskData.submissionFile || task.submissionFile,
      actualTime: taskData.actualTime || task.actualTime,
      submittedAt: taskData.submittedAt || task.submittedAt,
      category: taskData.category || task.category || taskData.type || "General",
      isAIGenerated: taskData.isAIGenerated || task.isAIGenerated || false,
      databaseId: task.databaseId || task.id || task._id,
      // Include additional fields for AI tasks
      resources: taskData.resources || task.resources || task.aiMetadata?.resources || [],
      topics: taskData.topics || task.topics || [],
      realWorldApplication: taskData.realWorldApplication || task.realWorldApplication,
      successCriteria: taskData.successCriteria || task.successCriteria || [],
      phase: taskData.phase || task.phase || task.aiMetadata?.phase,
      sequenceOrder: taskData.sequenceOrder || task.sequenceOrder,
      ptt: task.ptt || task.aiMetadata?.ptt,
      goal: task.goal,
      carriedCount: task.carriedCount || taskData.carriedCount || 0,
      wasEverCarried: task.wasEverCarried || taskData.wasEverCarried || false,
      lastCarriedDate: task.lastCarriedDate || taskData.lastCarriedDate,
      isCarriedToday: task.isCarriedToday || taskData.isCarriedToday || false,
      // Keep original data for backward compatibility
      data: taskData,
    };
  }, []);

  // NEW: Refresh AI-generated tasks with statistics
  const refreshAITasks = useCallback(async (goalId) => {
    try {
      setLoading(true);
      setError(null);

      if (!goalId) {
        console.warn("[TasksContext] refreshAITasks called without goalId");
        setTasks([]);
        setTaskStatistics(null);
        return { tasks: [], statistics: null };
      }

      console.log(`[TasksContext] Fetching AI tasks for goal ${goalId}`);
      const response = await apiService.getTaskStatsByGoal(goalId);
      

      const rawTasks = response.data?.tasks || [];
      const statistics = response.data?.statistics || null;

      // Normalize all tasks
      const normalizedTasks = rawTasks.map(normalizeTask);
      setTasks(normalizedTasks);

      // Always include allTasks in statistics for topic stats
      if (statistics && Array.isArray(normalizedTasks)) {
        statistics.allTasks = normalizedTasks;
      }
      setTaskStatistics(statistics);

      console.log(`[TasksContext] Refreshed AI tasks (goalId: ${goalId}):`, {
        taskCount: normalizedTasks.length,
        statistics
      });
      
      // Dispatch event to notify other components that tasks have been updated
      window.dispatchEvent(new CustomEvent("aiTasksUpdated", {
        detail: { goalId, tasks: normalizedTasks, statistics }
      }));
      
      return { tasks: normalizedTasks, statistics };
    } catch (err) {
      console.error("Failed to refresh AI tasks:", err);
      setError("Failed to refresh AI tasks");
      setTasks([]);
      setTaskStatistics(null);
      return { tasks: [], statistics: null };
    } finally {
      setLoading(false);
    }
  }, [normalizeTask]);

  // UPDATED: Refresh all tasks from server (now uses AI endpoints if available)
  const refreshTasks = useCallback(async (goalId = null) => {
    try {
      setLoading(true);
      setError(null);

      // Try to use AI tasks first if goalId is provided
      if (goalId) {
        try {
          const aiResult = await refreshAITasks(goalId);
          if (aiResult.tasks.length > 0) {
            return aiResult.tasks;
          }
        } catch (aiError) {
          console.warn("[TasksContext] AI tasks not available, falling back to regular tasks:", aiError);
        }
      }

      // Fallback to regular task endpoints
      const response = await apiService.getTasks(goalId);
      const rawTasks = response.data?.tasks || [];

      // Normalize all tasks
      const normalizedTasks = rawTasks.map(normalizeTask);
      setTasks(normalizedTasks);

      console.log(`[TasksContext] Refreshed tasks (goalId: ${goalId}):`, normalizedTasks.length);
      
      // Dispatch event to notify other components that tasks have been updated
      window.dispatchEvent(new CustomEvent("tasksUpdated"));
      
      return normalizedTasks;
    } catch (err) {
      console.error("Failed to refresh tasks:", err);
      setError("Failed to refresh tasks");
      setTasks([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [normalizeTask, refreshAITasks]);

  // Get daily tasks using gated sequential logic (for today) or regular date query (for other dates)
  const getDailyTasks = useCallback(
    async (goalId) => {
      try {
        if (!goalId) {
          console.warn("[TasksContext] getDailyTasks called without goalId");
          return [];
        }

        const response = await apiService.getDailyTasks(goalId);
        const rawTasks = response.data?.tasks || [];

        // Normalize daily tasks
        const normalizedTasks = rawTasks.map(normalizeTask);
        console.log(
          `[TasksContext] Daily tasks (goalId: ${goalId}):`,
          normalizedTasks.length,
          response.data?.isGatedSequential ? "(gated sequential)" : "(regular query)"
        );
        return normalizedTasks;
      } catch (err) {
        console.error("Failed to get daily tasks:", err);
        return [];
      }
    },
    [normalizeTask]
  );

  // Request next task in sequence
  const requestNextTask = useCallback(
    async (goalId) => {
      try {
        if (!goalId) {
          throw new Error("Goal ID is required to request next task");
        }

        console.log(`[TasksContext] Requesting next task for goalId: ${goalId}`);
        const response = await apiService.requestNextTask(goalId);
        console.log(`[TasksContext] API response:`, response);
        
        const rawTasks = response.data?.tasks || [];

        // Normalize next tasks
        const normalizedTasks = rawTasks.map(normalizeTask);
        console.log(
          `[TasksContext] Requested next task (goalId: ${goalId}):`,
          normalizedTasks.length,
          normalizedTasks
        );
        return normalizedTasks;
      } catch (err) {
        console.error("Failed to request next task:", err);
        console.error("Error details:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });
        throw err;
      }
    },
    [normalizeTask]
  );

  // Initialize task sequences for a goal
  const initializeTaskSequences = useCallback(
    async (goalId) => {
      try {
        if (!goalId) {
          throw new Error("Goal ID is required to initialize sequences");
        }

        const response = await apiService.initializeTaskSequences(goalId);
        console.log(
          `[TasksContext] Initialized task sequences (goalId: ${goalId}):`,
          response.data?.updatedCount
        );
        return response.data;
      } catch (err) {
        console.error("Failed to initialize task sequences:", err);
        throw err;
      }
    },
    []
  );

  // Get assigned tasks only (for calendar) - HIDES ALL QUEUED TASKS
  const getAssignedTasks = useCallback(
    async (goalId) => {
      try {
        if (!goalId) {
          console.warn("[TasksContext] getAssignedTasks called without goalId");
          return [];
        }

        const response = await apiService.getAssignedTasks(goalId);
        const rawTasks = response.data?.tasks || [];

        // Normalize assigned tasks
        const normalizedTasks = rawTasks.map(normalizeTask);
        console.log(
          `[TasksContext] Assigned tasks only (goalId: ${goalId}):`,
          normalizedTasks.length,
          "(queued tasks hidden)"
        );
        return normalizedTasks;
      } catch (err) {
        console.error("Failed to get assigned tasks:", err);
        return [];
      }
    },
    [normalizeTask]
  );

  // Get tasks for a specific date (legacy function, now enhanced)
  const getTasksByDate = useCallback(
    async (date, goalId = null) => {
      try {
        const dateString = utcToLocalDateString(date);
        
        // Check if this is today's date
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        // For today with a goalId, use the new gated sequential logic
        if (isToday && goalId) {
          return await getDailyTasks(goalId);
        }
        
        // For other dates or no goalId, use regular date query (only assigned tasks)
        const response = await apiService.getTasksByDate(dateString, goalId);
        const rawTasks = response.data?.tasks || [];

        // Normalize date-specific tasks
        const normalizedTasks = rawTasks.map(normalizeTask);
        console.log(
          `[TasksContext] Tasks for ${dateString} (goalId: ${goalId}):`,
          normalizedTasks.length,
          "(only assigned tasks shown)"
        );
        return normalizedTasks;
      } catch (err) {
        console.error("Failed to get tasks by date:", err);
        return [];
      }
    },
    [normalizeTask, getDailyTasks]
  );

  // Submit task - unified function used everywhere
  const submitTask = useCallback(
    async ({ taskId, submissionType, file, timeSpent, task }) => {
      try {
        setLoading(true);
        setError(null);

        // Validate inputs
        if (!taskId) {
          throw new Error("Task ID is required");
        }
        if (!submissionType) {
          throw new Error("Submission type is required");
        }
        if (!file) {
          throw new Error("File is required");
        }

        // Step 1: Upload file
        const formData = new FormData();
  formData.append("file", file);
  // taskId is passed via URL; Node backend derives title/description/criteria
  formData.append("submissionType", submissionType);

        console.log(
          "[TasksContext] FormData created with entries:",
          Array.from(formData.entries())
        );
  // taskId is not part of form data; it's in the URL
        console.log(
          "[TasksContext] FormData submissionType value:",
          formData.get("submissionType")
        );

  const uploadResponse = await apiService.uploadTaskSubmission(taskId, formData);

        console.log("[TasksContext] Upload response received:", uploadResponse);
        
        if (!uploadResponse) {
          throw new Error("No response received from upload service");
        }

        if (!uploadResponse.success || !uploadResponse.data?.fileId) {
          const details = uploadResponse.reason || uploadResponse.message;
          throw new Error(
            `File upload failed: ${details || "No file stored"}`
          );
        }

        // Check if a temporary taskId was used
        if (uploadResponse.data.isTemporaryTaskId) {
          console.warn(
            "[TasksContext] Backend used temporary taskId:",
            uploadResponse.data.taskId
          );
          console.warn("[TasksContext] Original taskId was:", taskId);
          console.warn(
            "[TasksContext] This indicates the taskId was not properly passed from frontend"
          );

          // For now, we'll skip the task update since we don't have a valid taskId
          // In a production system, you might want to handle this differently
          console.log(
            "[TasksContext] Skipping task update due to temporary taskId"
          );

          // Step 3: Refresh all tasks globally to ensure consistency
          await refreshTasks();

          console.log(
            "[TasksContext] Task submission completed (with temporary taskId)"
          );
          return { success: true, temporaryTaskId: true };
        }

        // Step 2: Skip explicit task update.
        // The Node upload-submission endpoint already updates the task after verification and storage.
        console.log(
          "[TasksContext] Skipping explicit task update; server updated task on upload."
        );

        // Step 3: Refresh all tasks globally to ensure consistency
        console.log("[TasksContext] Refreshing tasks after submission...");
        await refreshTasks();

        console.log("[TasksContext] Task submission completed successfully");
        return { success: true };
      } catch (error) {
        console.error("[TasksContext] Task submission failed:", error);
        setError("Failed to submit task");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [refreshTasks]
  );



  // Update task
  const updateTask = useCallback(
    async (taskId, taskData) => {
      try {
        setLoading(true);
        setError(null);

        console.log("[TasksContext] Updating task:", { taskId, taskData });

        const response = await apiService.updateTask(taskId, taskData);

        console.log("[TasksContext] Task update response:", response);

        // Refresh tasks after update
        await refreshTasks();

        return response;
      } catch (err) {
        console.error("[TasksContext] Failed to update task:", {
          taskId,
          taskData,
          error: err.message,
          response: err.response?.data,
        });
        setError(`Failed to update task: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshTasks]
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.deleteTask(taskId);

        // Refresh tasks after deletion
        await refreshTasks();

        return response;
      } catch (err) {
        console.error("Failed to delete task:", err);
        setError("Failed to delete task");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refreshTasks]
  );

  // View task submission using simple localStorage
  const viewTaskSubmission = useCallback(async (taskId) => {
    try {
      console.log("[TasksContext] viewTaskSubmission called:", { taskId });

      // Open server stream directly (no local storage)
  const result = await apiService.viewTaskSubmission(taskId);
      if (!result.success) {
        throw new Error(result.message || "Failed to view submission file");
      }

      console.log("[TasksContext] File opened successfully");
      return { success: true };
    } catch (error) {
      console.error("[TasksContext] Failed to view submission:", {
        taskId,
        error: error.message,
      });

      throw new Error(error.message || "Failed to view submission file");
    }
  }, [tasks]);

  // Download functionality is no longer needed with local storage
  // Files are viewed directly in the browser using LocalFileManager.viewFile
  const downloadTaskSubmission = useCallback(async (taskId, fileName) => {
    // For backward compatibility, redirect to viewTaskSubmission
    console.log("[TasksContext] downloadTaskSubmission redirecting to viewTaskSubmission");
    return viewTaskSubmission(taskId);
  }, [viewTaskSubmission]);

  // Initialize tasks on mount - don't auto-refresh without a goal
  // Tasks will be refreshed when a goal is selected
  useEffect(() => {
    // Only refresh if we have a specific goal context
    // The TasksPage will handle goal-specific refreshing
  }, [refreshTasks]);

  const value = {
    tasks,
    loading,
    error,
    taskStatistics,
    refreshTasks,
    refreshAITasks,
    getTasksByDate,
    getDailyTasks,
    getAssignedTasks,
    requestNextTask,
    initializeTaskSequences,
    submitTask,
    updateTask,
    deleteTask,
    viewTaskSubmission,
    downloadTaskSubmission,
  };

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
