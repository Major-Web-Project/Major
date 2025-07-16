import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Always send cookies
});

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log actual application errors, not development environment issues
    if (error.response && error.response.status >= 400) {
      console.warn("API Error:", error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// API functions with error handling
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      return await api.get("/health");
    } catch (error) {
      console.warn("Health check failed - using fallback data");
      return { data: { status: "OK", message: "Fallback mode" } };
    }
  },

  // Testimonials
  getTestimonials: async () => {
    try {
      return await api.get("/testimonials");
    } catch (error) {
      // Return fallback data if API fails
      return {
        data: [
          {
            id: 1,
            text: "It was nice experience.\nI have learned many NEW Things.\nAnd finally Achieved my goal!",
            author: "Sarah Johnson",
            role: "Web Developer",
            rating: 5,
          },
          {
            id: 2,
            text: "Amazing platform for learning!\nThe personalized approach helped me\nreach my career goals faster.",
            author: "Michael Chen",
            role: "Data Scientist",
            rating: 5,
          },
        ],
      };
    }
  },

  // Achievers
  getAchievers: async () => {
    try {
      return await api.get("/achievers");
    } catch (error) {
      return {
        data: [
          {
            id: 1,
            name: "Nick",
            image:
              "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
            field: "Web Development",
            achievement: "Full Stack Developer at Google",
            completionTime: "4 months",
          },
        ],
      };
    }
  },

  // Goals
  createGoal: async (goalData) => {
    try {
      return await api.post("/goals", goalData);
    } catch (error) {
      console.warn("Goal creation failed");
      return Promise.reject(error);
    }
  },

  // Learning fields
  getFields: async () => {
    try {
      return await api.get("/fields");
    } catch (error) {
      return {
        data: [
          {
            value: "design",
            label: "UI/UX Design",
            description: "Create beautiful and user-friendly interfaces",
          },
          {
            value: "development",
            label: "Web Development",
            description: "Build modern web applications",
          },
          {
            value: "marketing",
            label: "Digital Marketing",
            description: "Master online marketing strategies",
          },
        ],
      };
    }
  },

  // Chat
  sendMessage: async (message, context) => {
    try {
      return await api.post("/chat", { message, context });
    } catch (error) {
      return {
        data: {
          response: "I'm here to help you with your learning journey!",
          suggestions: [
            "Tell me about your goals",
            "What would you like to learn?",
            "How can I assist you today?",
          ],
        },
      };
    }
  },

  // Change Password
  changePassword: async (currentPassword, newPassword) => {
    try {
      return await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.warn("Password change failed");
      return Promise.reject(error);
    }
  },

  // Get dashboard data for authenticated user
  getDashboardData: async () => {
    try {
      return await api.get("/dashboard");
    } catch (error) {
      console.warn("Dashboard fetch failed");
      return Promise.reject(error);
    }
  },

  // Get all tasks for authenticated user
  getTasks: async () => {
    try {
      return await api.get("/tasks");
    } catch (error) {
      console.warn("Tasks fetch failed");
      return Promise.reject(error);
    }
  },

  // Create a new task
  createTask: async (taskData) => {
    try {
      return await api.post("/tasks", taskData);
    } catch (error) {
      console.warn("Task creation failed");
      return Promise.reject(error);
    }
  },

  // Get weekly activity for authenticated user
  getWeeklyActivity: async () => {
    try {
      return await api.get("/weekly-activity");
    } catch (error) {
      return { data: { activities: [] } };
    }
  },

  // Update a task by ID
  updateTask: async (taskId, data) => {
    try {
      return await api.put(`/tasks/${taskId}`, { data });
    } catch (error) {
      console.warn("Task update failed");
      return Promise.reject(error);
    }
  },

  // Get calendar daily stats for a given month and year
  getCalendarDailyStats: async (month, year) => {
    try {
      return await api.get(
        `/dashboard/calendar-daily-stats?month=${month}&year=${year}`
      );
    } catch (error) {
      console.warn("Calendar daily stats fetch failed");
      return Promise.reject(error);
    }
  },

  // Get tasks for a specific date
  getTasksByDate: async (date) => {
    try {
      return await api.get(`/tasks/by-date?date=${date}`);
    } catch (error) {
      console.warn("Tasks by date fetch failed");
      return Promise.reject(error);
    }
  },
};

export default api;
