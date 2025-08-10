import axios from "axios";
import { utcToLocalDateString } from "../utils/dateUtils";

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
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Log the API configuration for debugging
console.log("[API] Axios instance created with baseURL:", api.defaults.baseURL);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("[API] Request interceptor:", {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      isFormData: config.data instanceof FormData,
      contentType: config.headers["Content-Type"],
    });

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
api.interceptors.response.use(
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
export const getTasksByDate = (date) => api.get(`/tasks?date=${date}`);
export const getLearningStats = () => api.get("/learning/stats");
export const getAssessmentQuestions = () => api.get("/assessment/questions");

// Task methods
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const submitTask = (id, submission) =>
  api.post(`/tasks/${id}/submit`, submission);

// Fetch tasks by month: GET /api/tasks?month=YYYY-MM
export async function getTasksByMonth(month) {
  const { data } = await api.get(`/tasks?month=${month}`);
  return data; // array of tasks
}

// Create new task
export async function createTask(task) {
  const { data } = await api.post("/tasks", task);
  return data;
}

// Update existing task
export async function updateTask(task) {
  const { data } = await api.put(`/tasks/${task.id}`, task);
  return data;
}

// Additional API service methods for the new task components
export const apiService = {
  // Get tasks for a specific date - UNIFIED METHOD for both Calendar and DailyReportTable
  getTasksByDate: async (date) => {
    try {
      const response = await api.get(`/tasks?date=${date}`);
      // Backend returns { success: true, data: [...tasks] } for getTasksByDate
      const tasks = response.data?.data || [];

      console.log(`[API] Tasks for date ${date}:`, tasks);

      // Backend already formats the data correctly, so we can use it directly
      return { data: { tasks: Array.isArray(tasks) ? tasks : [] } };
    } catch (error) {
      console.error("Error fetching tasks by date:", error);
      return { data: { tasks: [] } }; // Return empty array on error
    }
  },

  // Get all tasks
  getTasks: async () => {
    try {
      const response = await api.get("/tasks");
      // Backend returns { success: true, data: [...tasks] }
      const tasks = response.data?.data || [];

      console.log("[API] All tasks:", tasks);

      // Backend already formats the data correctly, so we can use it directly
      return { data: { tasks: Array.isArray(tasks) ? tasks : [] } };
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return { data: { tasks: [] } }; // Return empty array on error
    }
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);

      console.log("[API] Create task response:", response.data);

      // Backend already formats the data correctly
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  // Update existing task
  updateTask: async (taskId, taskData) => {
    try {
      console.log("[API] Updating task:", {
        taskId,
        taskData,
        wrappedData: { data: taskData },
      });

      const response = await api.put(`/tasks/${taskId}`, { data: taskData });

      console.log("[API] Update task response:", response.data);

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

  // Upload task submission file
  uploadTaskSubmission: async (formData) => {
    try {
      console.log("[API] Uploading task submission:", {
        hasFormData: formData instanceof FormData,
        entries:
          formData instanceof FormData
            ? Array.from(formData.entries()).map(([key, value]) => [
                key,
                value instanceof File
                  ? { name: value.name, size: value.size, type: value.type }
                  : value,
              ])
            : "Not FormData",
      });

      const response = await api.post("/tasks/upload-submission", formData, {
        timeout: 30000, // Increase timeout for file uploads
        // Don't set Content-Type header - let axios set it automatically with boundary
      });

      console.log("[API] Upload response:", response.data);
      return response.data;
    } catch (error) {
      console.error("[API] Error uploading task submission:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  },

  // View task submission file
  viewTaskSubmission: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/submission`);
      return response.data;
    } catch (error) {
      console.error("Error viewing task submission:", error);
      throw error;
    }
  },

  // Download task submission file
  downloadTaskSubmission: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}/submission/download`, {
        responseType: "blob",
      });
      return response;
    } catch (error) {
      console.error("Error downloading task submission:", error);
      throw error;
    }
  },
};

export default api;
