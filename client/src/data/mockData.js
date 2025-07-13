// Centralized Mock Data for Database Integration
// TODO: Replace with actual API calls when connecting to database
// This file serves as the single source of truth for all application data

// Current User Data (TODO: Replace with authentication system)
export const currentUser = {
  id: 'user-001',
  name: 'Alex Johnson',
  email: 'alex.johnson@email.com',
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
  role: 'Premium Student',
  joinDate: '2024-01-15',
  coursesEnrolled: 7,
  tasksCompleted: 45,
  totalHoursLearned: 156.5,
  currentStreak: 12,
  achievements: ['Fast Learner', 'Consistent Student', 'High Achiever', 'Team Player'],
  skillsGained: ['React', 'Node.js', 'Python', 'UI/UX Design', 'Data Analysis', 'Machine Learning']
};

// Available Courses Data
export const availableCourses = [
  {
    id: 'REACT-ADV-001',
    name: 'Advanced React Development',
    category: 'Frontend Development',
    instructor: 'Sarah Johnson - Senior React Instructor',
    difficulty: 'advanced',
    color: 'from-blue-500 to-cyan-500',
    description: 'Master advanced React concepts including hooks, context, performance optimization, and modern patterns.',
    duration: '12 weeks',
    studentsEnrolled: 2847,
    rating: 4.9,
    price: 299,
    features: ['Live Projects', 'Code Reviews', 'Career Support', '24/7 Mentorship'],
    curriculum: ['Advanced Hooks', 'State Management', 'Performance Optimization', 'Testing', 'Deployment']
  },
  {
    id: 'DB-DESIGN-002',
    name: 'Database Design & Architecture',
    category: 'Backend Development',
    instructor: 'Michael Chen - Database Architect',
    difficulty: 'intermediate',
    color: 'from-green-500 to-emerald-500',
    description: 'Learn to design scalable database systems with proper normalization, indexing, and optimization.',
    duration: '10 weeks',
    studentsEnrolled: 1923,
    rating: 4.8,
    price: 249,
    features: ['Real Database Projects', 'Performance Tuning', 'Industry Best Practices'],
    curriculum: ['Database Design', 'SQL Optimization', 'NoSQL', 'Scaling', 'Security']
  },
  {
    id: 'UX-RESEARCH-003',
    name: 'UX Research & Design Thinking',
    category: 'UX Design',
    instructor: 'Emily Rodriguez - UX Design Lead',
    difficulty: 'intermediate',
    color: 'from-purple-500 to-pink-500',
    description: 'Master user research methodologies and design thinking processes for creating user-centered products.',
    duration: '8 weeks',
    studentsEnrolled: 3156,
    rating: 4.9,
    price: 199,
    features: ['User Research Tools', 'Design Portfolio', 'Industry Mentorship'],
    curriculum: ['User Research', 'Personas', 'Journey Mapping', 'Prototyping', 'Testing']
  },
  {
    id: 'QA-AUTO-004',
    name: 'Automated Testing & QA',
    category: 'Quality Assurance',
    instructor: 'David Kim - QA Engineer',
    difficulty: 'intermediate',
    color: 'from-yellow-500 to-orange-500',
    description: 'Build comprehensive test automation frameworks and implement quality assurance best practices.',
    duration: '9 weeks',
    studentsEnrolled: 1456,
    rating: 4.7,
    price: 229,
    features: ['Automation Tools', 'CI/CD Integration', 'Performance Testing'],
    curriculum: ['Test Automation', 'API Testing', 'Performance Testing', 'CI/CD', 'Bug Tracking']
  },
  {
    id: 'ML-ADV-005',
    name: 'Advanced Machine Learning',
    category: 'Machine Learning',
    instructor: 'Dr. Lisa Thompson - ML Research Scientist',
    difficulty: 'advanced',
    color: 'from-red-500 to-pink-500',
    description: 'Deep dive into advanced ML algorithms, neural networks, and real-world AI applications.',
    duration: '16 weeks',
    studentsEnrolled: 987,
    rating: 4.9,
    price: 399,
    features: ['Research Projects', 'GPU Access', 'Industry Partnerships', 'Publication Support'],
    curriculum: ['Deep Learning', 'Neural Networks', 'Computer Vision', 'NLP', 'MLOps']
  },
  {
    id: 'DM-ANALYTICS-006',
    name: 'Digital Marketing Analytics',
    category: 'Digital Marketing',
    instructor: 'Mark Wilson - Marketing Director',
    difficulty: 'beginner',
    color: 'from-indigo-500 to-purple-500',
    description: 'Learn data-driven marketing strategies and analytics tools to optimize campaigns and ROI.',
    duration: '6 weeks',
    studentsEnrolled: 2341,
    rating: 4.6,
    price: 149,
    features: ['Analytics Tools', 'Campaign Management', 'ROI Optimization'],
    curriculum: ['Google Analytics', 'Social Media Analytics', 'Email Marketing', 'SEO', 'PPC']
  },
  {
    id: 'MOBILE-OPT-007',
    name: 'Mobile App Optimization',
    category: 'Mobile Development',
    instructor: 'Alex Johnson - Mobile Tech Lead',
    difficulty: 'advanced',
    color: 'from-teal-500 to-cyan-500',
    description: 'Optimize mobile app performance, user experience, and deployment strategies.',
    duration: '11 weeks',
    studentsEnrolled: 1678,
    rating: 4.8,
    price: 279,
    features: ['Performance Profiling', 'App Store Optimization', 'Cross-Platform Development'],
    curriculum: ['Performance Optimization', 'React Native', 'Flutter', 'App Store Deployment', 'Analytics']
  }
];

// Testimonials Data
export const testimonials = [
  {
    id: 1,
    text: "The Complete Web Development Bootcamp\nwas absolutely amazing! I learned\neverything from HTML to React and Node.js.\nNow I'm working at Google!",
    author: "Nick",
    role: "Full Stack Developer at Google",
    course: "Complete Web Development Bootcamp",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 5,
    completionTime: "4 months"
  },
  {
    id: 2,
    text: "Advanced Machine Learning & AI course\nchanged my career completely!\nThe hands-on projects and mentorship\nhelped me land my dream job at Microsoft.",
    author: "Adil",
    role: "ML Engineer at Microsoft",
    course: "Advanced Machine Learning & AI",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 5,
    completionTime: "6 months"
  },
  {
    id: 3,
    text: "Professional UI/UX Design Mastery\nwas exactly what I needed!\nThe design principles and practical projects\nmade me confident enough to join Apple.",
    author: "Marina",
    role: "Senior Designer at Apple",
    course: "Professional UI/UX Design Mastery",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 5,
    completionTime: "3 months"
  },
  {
    id: 4,
    text: "Digital Marketing & Growth Hacking\ncourse was incredibly comprehensive!\nI learned everything from SEO to social media\nand now I'm leading marketing at Meta.",
    author: "Dean",
    role: "Marketing Director at Meta",
    course: "Digital Marketing & Growth Hacking",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 5,
    completionTime: "5 months"
  },
  {
    id: 5,
    text: "Advanced AI & Deep Learning course\nwas mind-blowing! The cutting-edge content\nand research-focused approach prepared me\nfor my role at OpenAI perfectly.",
    author: "Max",
    role: "AI Researcher at OpenAI",
    course: "Advanced AI & Deep Learning",
    image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 5,
    completionTime: "8 months"
  }
];

// Achievers Data
export const achievers = [
  {
    id: 1,
    name: "Nick",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    achievement: "Full Stack Developer at Google",
    field: "Web Development",
    duration: "4 months",
    course: "Complete Web Development Bootcamp",
    borderColor: "from-blue-400 to-cyan-400",
    textColor: "text-blue-400",
    bgColor: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 2,
    name: "Adil", 
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
    achievement: "ML Engineer at Microsoft",
    field: "Data Science & AI",
    duration: "6 months",
    course: "Advanced Machine Learning & AI",
    borderColor: "from-purple-400 to-pink-400",
    textColor: "text-purple-400",
    bgColor: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: 3,
    name: "Marina",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    achievement: "Senior Designer at Apple",
    field: "UI/UX Design",
    duration: "3 months",
    course: "Professional UI/UX Design Mastery",
    borderColor: "from-pink-400 to-rose-400",
    textColor: "text-pink-400",
    bgColor: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: 4,
    name: "Dean",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
    achievement: "Marketing Director at Meta",
    field: "Digital Marketing",
    duration: "5 months",
    course: "Digital Marketing & Growth Hacking",
    borderColor: "from-green-400 to-emerald-400",
    textColor: "text-green-400", 
    bgColor: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: 5,
    name: "Max",
    image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
    achievement: "AI Researcher at OpenAI",
    field: "Artificial Intelligence",
    duration: "8 months",
    course: "Advanced AI & Deep Learning",
    borderColor: "from-indigo-400 to-purple-400",
    textColor: "text-indigo-400",
    bgColor: "from-indigo-500/20 to-purple-500/20",
  },
];

// Dashboard Data
export const dashboardData = {
  weeklyActivity: [
    { day: 'Sun', goal: 100, completed: 100 },
    { day: 'Mon', goal: 100, completed: 60 },
    { day: 'Tue', goal: 100, completed: 80 },
    { day: 'Wed', goal: 100, completed: 87 },
    { day: 'Thu', goal: 100, completed: 40 },
    { day: 'Fri', goal: 100, completed: 20 },
    { day: 'Sat', goal: 100, completed: 45 }
  ],
  statusHistory: [
    { date: '2025-01-01', value: 65 },
    { date: '2025-01-02', value: 72 },
    { date: '2025-01-03', value: 68 },
    { date: '2025-01-04', value: 85 },
    { date: '2025-01-05', value: 78 },
    { date: '2025-01-06', value: 92 },
    { date: '2025-01-07', value: 88 },
    { date: '2025-01-08', value: 95 },
    { date: '2025-01-09', value: 82 },
    { date: '2025-01-10', value: 90 },
    { date: '2025-01-11', value: 87 },
    { date: '2025-01-12', value: 93 }
  ],
  statistics: {
    assignments: 30,
    selfStudy: 45,
    lectures: 25
  },
  dailyReport: [
    {
      date: '2025-01-19',
      tasks: [
        {
          id: '1',
          name: 'Complete React Components Module',
          status: 'completed',
          priority: 'high',
          notes: 'Finished all exercises and built a sample project. Learned about hooks, state management, and component lifecycle.',
          completionTime: '2.5 hours',
          createdAt: '2025-01-19T09:00:00Z',
          estimatedTime: '3 hours'
        },
        {
          id: '2', 
          name: 'Review JavaScript Fundamentals',
          status: 'in-progress',
          priority: 'medium',
          notes: 'Currently on closures and async/await concepts. Need to practice more with promises.',
          createdAt: '2025-01-19T10:00:00Z',
          estimatedTime: '2 hours'
        },
        {
          id: '3',
          name: 'Submit Portfolio Project',
          status: 'pending',
          priority: 'high',
          notes: 'Need to add final touches and deploy to production. Missing responsive design for mobile.',
          createdAt: '2025-01-19T11:00:00Z',
          estimatedTime: '4 hours'
        }
      ]
    }
  ]
};

// Task Templates for generating realistic tasks
export const taskTemplates = [
  {
    type: 'project',
    titles: [
      'Build {technology} Dashboard with {feature}',
      'Create {type} Application using {technology}',
      'Develop {feature} System with {technology}',
      'Design and Implement {type} Platform',
      'Build Full-Stack {type} with {technology}'
    ],
    technologies: ['React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'C#', 'PHP'],
    features: ['Authentication', 'Real-time Chat', 'Payment Integration', 'Analytics', 'API Integration', 'Data Visualization'],
    types: ['E-commerce', 'Social Media', 'Learning Management', 'Project Management', 'CRM', 'Blog']
  },
  {
    type: 'assignment',
    titles: [
      '{subject} Analysis and Implementation',
      '{concept} Research and Documentation',
      '{technology} Best Practices Study',
      '{subject} Case Study Analysis',
      '{concept} Performance Optimization'
    ],
    subjects: ['Database Schema', 'API Design', 'Security Architecture', 'User Experience', 'Algorithm Design'],
    concepts: ['Performance', 'Scalability', 'Security', 'Usability', 'Accessibility', 'Maintainability'],
    technologies: ['React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'AWS', 'Docker']
  },
  {
    type: 'quiz',
    titles: [
      '{subject} Knowledge Assessment',
      '{technology} Fundamentals Quiz',
      '{concept} Understanding Test',
      '{subject} Practical Evaluation',
      '{technology} Advanced Concepts Quiz'
    ],
    subjects: ['Programming Logic', 'Database Design', 'Web Security', 'UI/UX Principles', 'Software Architecture'],
    concepts: ['Object-Oriented Programming', 'Functional Programming', 'Design Patterns', 'Data Structures'],
    technologies: ['JavaScript', 'Python', 'React', 'SQL', 'CSS', 'HTML', 'Git', 'Linux']
  }
];

// Generate comprehensive random tasks with consistent data
export const generateRandomTasks = (count = 50) => {
  const tasks = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const course = availableCourses[Math.floor(Math.random() * availableCourses.length)];
    const taskTemplate = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
    
    // Generate realistic dates
    const assignedDaysAgo = Math.floor(Math.random() * 30);
    const dueDaysFromAssigned = Math.floor(Math.random() * 14) + 3;
    
    const assignedDate = new Date(today);
    assignedDate.setDate(today.getDate() - assignedDaysAgo);
    
    const dueDate = new Date(assignedDate);
    dueDate.setDate(assignedDate.getDate() + dueDaysFromAssigned);
    
    // Generate task title based on template
    let title = taskTemplate.titles[Math.floor(Math.random() * taskTemplate.titles.length)];
    if (taskTemplate.type === 'project') {
      const tech = taskTemplate.technologies[Math.floor(Math.random() * taskTemplate.technologies.length)];
      const feature = taskTemplate.features[Math.floor(Math.random() * taskTemplate.features.length)];
      const type = taskTemplate.types[Math.floor(Math.random() * taskTemplate.types.length)];
      title = title.replace('{technology}', tech).replace('{feature}', feature).replace('{type}', type);
    }
    
    // Determine status and other properties
    let status = 'pending';
    let actualTime;
    let grade;
    let submissionType;
    
    const isOverdue = dueDate < today;
    
    if (isOverdue && Math.random() < 0.3) {
      status = 'overdue';
    } else if (assignedDaysAgo > 2 && Math.random() < 0.4) {
      status = 'completed';
      actualTime = Math.random() * 20 + 2;
      grade = Math.floor(Math.random() * 30) + 70;
      submissionType = Math.random() < 0.6 ? 'pdf' : 'excel';
    } else if (assignedDaysAgo > 1 && Math.random() < 0.3) {
      status = 'in-progress';
    }
    
    const priority = 
      course.difficulty === 'advanced' ? 'high' :
      course.difficulty === 'intermediate' ? 'medium' : 'low';
    
    const estimatedTime = Math.floor(Math.random() * 15) + 3;
    
    const task = {
      id: `task-${i + 1}`,
      title,
      description: `This ${taskTemplate.type} focuses on ${title.toLowerCase()}. You will work with ${course.category.toLowerCase()} concepts and apply them in a practical context.`,
      assignedDate: assignedDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      priority,
      status,
      estimatedTime,
      actualTime,
      category: course.category,
      assignedBy: course.instructor,
      tags: ['React', 'JavaScript', 'CSS', 'HTML'],
      courseId: course.id,
      courseName: course.name,
      submissionType,
      difficultyLevel: course.difficulty,
      skillsGained: ['Programming', 'Problem Solving'],
      learningObjectives: ['Understand core concepts', 'Apply best practices'],
      prerequisites: ['Basic programming knowledge'],
      resources: [
        { type: 'video', title: 'Introduction Video', url: '#' },
        { type: 'documentation', title: 'Official Docs', url: '#' }
      ],
      gradeWeight: Math.floor(Math.random() * 20) + 10,
      maxAttempts: 2,
      currentAttempt: status === 'completed' ? 1 : 0,
      grade
    };
    
    tasks.push(task);
  }
  
  return tasks.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
};

// API Service Functions (TODO: Replace with actual API calls)
export const mockApiService = {
  // User Authentication
  login: async (email, password) => {
    // TODO: Replace with actual authentication API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ user: currentUser, token: 'mock-jwt-token' });
      }, 1000);
    });
  },

  register: async (userData) => {
    // TODO: Replace with actual registration API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ user: { ...currentUser, ...userData }, token: 'mock-jwt-token' });
      }, 1000);
    });
  },

  // Data Fetching
  getCurrentUser: async () => currentUser,
  getCourses: async () => availableCourses,
  getTestimonials: async () => testimonials,
  getAchievers: async () => achievers,
  getDashboardData: async () => dashboardData,
  getTasks: async () => generateRandomTasks(50),

  // Data Mutations
  createTask: async (taskData) => {
    // TODO: Replace with actual API call
    console.log('Creating task:', taskData);
    return { success: true, task: taskData };
  },

  updateTask: async (taskId, updates) => {
    // TODO: Replace with actual API call
    console.log('Updating task:', taskId, updates);
    return { success: true };
  },

  submitTask: async (taskId, submissionData) => {
    // TODO: Replace with actual API call
    console.log('Submitting task:', taskId, submissionData);
    return { success: true };
  }
};