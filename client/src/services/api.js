import axios from "axios";
import { utcToLocalDateString } from "../utils/dateUtils";
// Local storage file methods removed; uploads go to server

// Import auth store for handling authentication failures
let authStore = null;
const getAuthStore = async () => {
  if (!authStore) {
    const { useAuthStore } = await import("../store/authStore.js");
    authStore = useAuthStore;
  }
  return authStore;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout for regular operations
  headers: {
    "Content-Type": "application/json",
  },
});

// Create a separate instance for AI operations with NO timeout
const aiApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 0, // NO timeout - let AI take as long as needed
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to setup interceptors for both instances
const setupInterceptors = (apiInstance) => {
  // Request interceptor to add auth token
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // For FormData, remove the default Content-Type to let browser set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle auth errors
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401) {
        // Clear invalid token from localStorage
        localStorage.removeItem("token");

        // Get auth store to clear authentication state
        try {
          const store = await getAuthStore();
          const { handleAuthFailure } = store.getState();
          const errorMessage =
            error.response?.data?.message ||
            "Your session has expired. Please log in again.";
          handleAuthFailure(errorMessage);
        } catch (storeError) {
          console.error("Failed to access auth store:", storeError);
        }

        // Show user-friendly error message and redirect
        if (typeof window !== "undefined") {
          // Check if we're not already on the auth page to avoid infinite redirects
          const currentPath = window.location.pathname;
          if (!currentPath.includes("/auth")) {
            // Show error message
            const errorMessage =
              error.response?.data?.message ||
              "Your session has expired. Please log in again.";
            console.error("Authentication failed:", errorMessage);

            // Redirect to login page
            window.location.href = "/auth/signin";
          }
        }
      }

      // Handle other error types with user-friendly messages
      else if (error.response?.status >= 500) {
        const serverErrorMessage =
          "Server error occurred. Please try again later.";
        console.error("Server error:", error);
      }

      // Handle network errors
      else if (
        !error.response &&
        (error.code === "NETWORK_ERROR" || error.message === "Network Error")
      ) {
        const networkErrorMessage =
          "Network error. Please check your connection and try again.";
        console.error("Network error:", error);
      }

      // Handle timeout errors
      else if (error.code === "ECONNABORTED") {
        const timeoutErrorMessage = "Request timed out. Please try again.";
        console.error("Timeout error:", error);
      }

      return Promise.reject(error);
    }
  );
};

// Apply interceptors to both instances
setupInterceptors(api);
setupInterceptors(aiApi);

// Auth methods
export const login = (credentials) => api.post("/auth/login", credentials);
export const signup = (userData) => api.post("/auth/signup", userData);
export const logout = () => api.post("/auth/logout");
export const verifyAuth = () => api.get("/auth/me");

// Dashboard methods
export const getDashboardData = async () => {
  const { data } = await api.get("/dashboard");
  return data; // { success, tasks, summary }
};
export async function getAchievers() {
  const res = await api.get("/achievers");
  return res.data;
}
export const getTasksByDate = (date, goalId = null) => {
  let url = `/tasks?date=${date}`;
  if (goalId) {
    url += `&goalId=${goalId}`;
  }
  return api.get(url);
};
export const getLearningStats = () => api.get("/learning/stats");

// Task methods
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const submitTask = (id, submission) =>
  api.post(`/tasks/${id}/submit`, submission);

// Fetch tasks by month: GET /api/tasks?month=YYYY-MM
export async function getTasksByMonth(month) {
  const { data } = await api.get(`/tasks?month=${month}`);
  return data; // array of tasks
}

// Update existing task
export async function updateTask(task) {
  const { data } = await api.put(`/tasks/${task.id}`, task);
  return data;
}

// Additional API service methods for the new task components
export const apiService = {
  // Get tasks for a specific date - UNIFIED METHOD for both Calendar and DailyReportTable
  getTasksByDate: async (date, goalId = null) => {
    try {
      let url = `/tasks?date=${date}`;
      if (goalId) {
        url += `&goalId=${goalId}`;
      }
      const response = await api.get(url);
      // Backend returns { success: true, data: [...tasks] } for getTasksByDate
      const tasks = response.data?.data || [];

      // Backend already formats the data correctly, so we can use it directly
      return { data: { tasks: Array.isArray(tasks) ? tasks : [] } };
    } catch (error) {
      console.error("Error fetching tasks by date:", error);
      return { data: { tasks: [] } }; // Return empty array on error
    }
  },

  // Get all tasks
  getTasks: async (goalId = null) => {
    try {
      let url = "/tasks";
      if (goalId) {
        url += `?goalId=${goalId}`;
      }
      const response = await api.get(url);
      // Backend returns { success: true, data: [...tasks] }
      const tasks = response.data?.data || [];

      // Backend already formats the data correctly, so we can use it directly
      return { data: { tasks: Array.isArray(tasks) ? tasks : [] } };
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return { data: { tasks: [] } }; // Return empty array on error
    }
  },

  // GATED SEQUENTIAL TASK SYSTEM - Get daily tasks using gated sequential logic
  getDailyTasks: async (goalId) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required for daily tasks");
      }

      const response = await api.get(`/tasks/daily?goalId=${goalId}`);
      const tasks = response.data?.data || [];

      return {
        data: {
          tasks: Array.isArray(tasks) ? tasks : [],
          isGatedSequential: response.data?.isGatedSequential || false,
        },
      };
    } catch (error) {
      console.error("Error fetching daily tasks:", error);
      throw error;
    }
  },

  // GATED SEQUENTIAL TASK SYSTEM - Request next task in sequence
  requestNextTask: async (goalId) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required to request next task");
      }

      const response = await api.post("/tasks/request-next", { goalId });
      const tasks = response.data?.data || [];

      // If new tasks were provided, dispatch event to notify components
      if (tasks && tasks.length > 0) {
        window.dispatchEvent(
          new CustomEvent("tasksUpdated", {
            detail: {
              action: "newTasksAdded",
              goalId: goalId,
              message: "New tasks have been added to your sequence",
            },
          })
        );
      }

      return {
        data: {
          tasks: Array.isArray(tasks) ? tasks : [],
          message: response.data?.message,
        },
      };
    } catch (error) {
      console.error("Error requesting next task:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // GATED SEQUENTIAL TASK SYSTEM - Initialize task sequences for a goal
  initializeTaskSequences: async (goalId) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required to initialize sequences");
      }

      const response = await api.post("/tasks/initialize-sequences", {
        goalId,
      });

      return response;
    } catch (error) {
      console.error("Error initializing task sequences:", error);
      throw error;
    }
  },

  // Get only assigned tasks (for calendar and dashboard) - HIDES ALL QUEUED TASKS
  getAssignedTasks: async (goalId) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required for assigned tasks");
      }

      const response = await api.get(`/tasks/assigned?goalId=${goalId}`);
      const tasks = response.data?.data || [];

      return {
        data: {
          tasks: Array.isArray(tasks) ? tasks : [],
          onlyAssignedTasks: response.data?.onlyAssignedTasks || false,
        },
      };
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      throw error;
    }
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  // Update existing task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, { data: taskData });

      // Backend already formats the data correctly
      return response.data;
    } catch (error) {
      console.error("[API] Error updating task:", {
        taskId,
        taskData,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
      });
      throw error;
    }
  },

  // Get task by ID
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting task by ID:", error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  // File upload - send to Node server which forwards to Django for verification, then stores in GridFS
  uploadTaskSubmission: async (taskId, formData) => {
    try {
      // POST multipart to Node server; Node calls Django /api/file-check/ internally
      const { data } = await api.post(
        `/tasks/${taskId}/upload-submission`,
        formData
      );
      return data; // { success, data: { fileId, ... }, message }
    } catch (error) {
      console.error("[API] Error uploading submission:", error);
      const message =
        error.response?.data?.message || error.message || "Upload failed";
      const reason = error.response?.data?.reason;
      return { success: false, message, reason };
    }
  },

  // View task submission by opening authenticated stream endpoint
  viewTaskSubmission: async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      const url = `${api.defaults.baseURL}/tasks/${taskId}/submission${
        token ? `?token=${token}` : ""
      }`;
      const newWindow = window.open(url, "_blank");
      if (!newWindow) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }
      return { success: true, message: "Opened" };
    } catch (error) {
      console.error("[API] Error viewing file:", error);
      return { success: false, message: error.message || "Failed to view" };
    }
  },

  // Get file metadata - not implemented (server handles)
  getFileMetadata: async (_filePath) => ({ success: true, data: {} }),

  // Note: Files are uploaded to server for verification and storage.

  // Additional utility methods for file management
  getStorageInfo: async () => null,

  clearOldFiles: async (_daysOld = 30) => 0,

  getFilesByTaskId: async (_taskId) => [],

  // --- NEW AI TASK ENDPOINTS ---

  // Get AI-generated tasks for a goal with statistics
  getAITasksForGoal: async (goalId, options = {}) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required");
      }

      const params = new URLSearchParams({
        page: options.page || 1,
        limit: options.limit || 50,
        ...(options.status && { status: options.status }),
      });

      const response = await api.get(`/ai/tasks/by-goal/${goalId}?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching AI tasks for goal:", error);
      throw error;
    }
  },

  // Create Task documents from stored AI output
  createTasksFromAIOutput: async (goalId) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required");
      }

      const response = await api.post("/ai/tasks/create-from-output", {
        goalId,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating tasks from AI output:", error);
      throw error;
    }
  },

  // Get task statistics by phase and topic for a goal
  getTaskStatsByGoal: async (goalId) => {
    try {
      if (!goalId) {
        throw new Error("Goal ID is required");
      }

      // Fetch ALL tasks for statistics calculation (set very high limit to get all tasks)
      const response = await apiService.getAITasksForGoal(goalId, {
        limit: 10000,
      });
      const tasks = response.data?.tasks || [];

      // Calculate statistics by phase and topic
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task) => task.status === "completed")
          .length,
        byPhase: {},
        byTopic: {},
        overall: {
          total: tasks.length,
          completed: tasks.filter((task) => task.status === "completed").length,
          inProgress: tasks.filter((task) => task.status === "in-progress")
            .length,
          notStarted: tasks.filter(
            (task) => !task.status || task.status === "not-started"
          ).length,
          completionPercentage:
            tasks.length > 0
              ? (tasks.filter((task) => task.status === "completed").length /
                  tasks.length) *
                100
              : 0,
        },
      };

      tasks.forEach((task) => {
        const phase = task.aiMetadata?.phase || task.phase || 1;
        const topic = task.aiMetadata?.topic || "General";
        const isCompleted = task.status === "completed";

        // Ensure phase is treated as both string and number keys for compatibility
        const phaseKey = String(phase); // Store as string for consistency
        const topicKey = String(topic); // Store as string for consistency

        // Phase statistics
        if (!stats.byPhase[phaseKey]) {
          stats.byPhase[phaseKey] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            completionPercentage: 0,
          };
        }
        stats.byPhase[phaseKey].total++;
        if (isCompleted) {
          stats.byPhase[phaseKey].completed++;
        } else if (task.status === "in-progress") {
          stats.byPhase[phaseKey].inProgress++;
        } else {
          stats.byPhase[phaseKey].notStarted++;
        }

        // Topic statistics
        if (!stats.byTopic[topicKey]) {
          stats.byTopic[topicKey] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            completionPercentage: 0,
          };
        }
        stats.byTopic[topicKey].total++;
        if (isCompleted) {
          stats.byTopic[topicKey].completed++;
        } else if (task.status === "in-progress") {
          stats.byTopic[topicKey].inProgress++;
        } else {
          stats.byTopic[topicKey].notStarted++;
        }
      });

      // Calculate completion percentages for phases
      Object.keys(stats.byPhase).forEach((phase) => {
        const phaseStats = stats.byPhase[phase];
        phaseStats.completionPercentage =
          phaseStats.total > 0
            ? (phaseStats.completed / phaseStats.total) * 100
            : 0;
      });

      // Calculate completion percentages for topics
      Object.keys(stats.byTopic).forEach((topic) => {
        const topicStats = stats.byTopic[topic];
        topicStats.completionPercentage =
          topicStats.total > 0
            ? (topicStats.completed / topicStats.total) * 100
            : 0;
      });

      console.log("[API] Final task statistics:", {
        totalTasks: stats.overall.total,
        phaseKeys: Object.keys(stats.byPhase),
        topicKeys: Object.keys(stats.byTopic),
        byPhase: stats.byPhase,
        byTopic: stats.byTopic,
      });

      return {
        success: true,
        data: {
          tasks,
          statistics: stats,
        },
      };
    } catch (error) {
      console.error("Error getting task statistics:", error);
      throw error;
    }
  },

  // Complete a task by updating its status
  completeTask: async (taskId) => {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const response = await api.put(`/tasks/${taskId}`, {
        data: {
          status: "completed",
          completedAt: new Date().toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  },
};

// Goal creation with NO timeout - let AI generate all needed tasks
export const createGoalWithUnlimitedTime = async (goalData) => {
  return aiApi.post("/goals/create-roadmap", goalData);
};

// Export AI API instance
export { aiApi };
export default api;
