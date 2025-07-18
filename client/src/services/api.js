import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log actual application errors, not development environment issues
    if (error.response && error.response.status >= 400) {
      console.warn('API Error:', error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

// API functions with error handling
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      return await api.get('/health');
    } catch (error) {
      console.warn('Health check failed - using fallback data');
      return { data: { status: 'OK', message: 'Fallback mode' } };
    }
  },

  // Testimonials
  getTestimonials: async () => {
    try {
      return await api.get('/testimonials');
    } catch (error) {
      // Return fallback data if API fails
      return {
        data: [
          {
            id: 1,
            text: 'It was nice experience.\nI have learned many NEW Things.\nAnd finally Achieved my goal!',
            author: 'Sarah Johnson',
            role: 'Web Developer',
            rating: 5,
          },
          {
            id: 2,
            text: 'Amazing platform for learning!\nThe personalized approach helped me\nreach my career goals faster.',
            author: 'Michael Chen',
            role: 'Data Scientist',
            rating: 5,
          },
        ],
      };
    }
  },

  // Achievers
  getAchievers: async () => {
    try {
      return await api.get('/achievers');
    } catch (error) {
      return {
        data: [
          {
            id: 1,
            name: 'Nick',
            image:
              'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
            field: 'Web Development',
            achievement: 'Full Stack Developer at Google',
            completionTime: '4 months',
          },
        ],
      };
    }
  },

  // Goals
  createGoal: async (goalData) => {
    try {
      return await api.post('/goals', goalData);
    } catch (error) {
      console.warn('Goal creation failed');
      return Promise.reject(error);
    }
  },

  // Learning fields
  getFields: async () => {
    try {
      return await api.get('/fields');
    } catch (error) {
      return {
        data: [
          {
            value: 'design',
            label: 'UI/UX Design',
            description: 'Create beautiful and user-friendly interfaces',
          },
          {
            value: 'development',
            label: 'Web Development',
            description: 'Build modern web applications',
          },
          {
            value: 'marketing',
            label: 'Digital Marketing',
            description: 'Master online marketing strategies',
          },
        ],
      };
    }
  },

  // Chat
  sendMessage: async (message, context) => {
    try {
      return await api.post('/chat', { message, context });
    } catch (error) {
      return {
        data: {
          response: "I'm here to help you with your learning journey!",
          suggestions: [
            'Tell me about your goals',
            'What would you like to learn?',
            'How can I assist you today?',
          ],
        },
      };
    }
  },
};

export default api;
