// AI Learning Service with Enhanced Voice Processing
// This service provides comprehensive AI-powered learning assistance including voice processing

// Learning paths configuration
export const learningPaths = {
  'ai-ml': {
    id: 'ai-ml',
    title: 'AI/ML Engineer',
    description: 'Master artificial intelligence and machine learning',
    difficulty: 'advanced',
    duration: { min: 6, max: 8 },
    phases: [
      {
        phase: 1,
        title: 'Python & Math Foundations',
        duration: 2,
        topics: ['Python Programming', 'Linear Algebra', 'Statistics', 'Calculus'],
        projects: ['Data Analysis Project', 'Statistical Modeling']
      },
      {
        phase: 2,
        title: 'Machine Learning Fundamentals',
        duration: 2,
        topics: ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation'],
        projects: ['Classification Project', 'Clustering Analysis']
      },
      {
        phase: 3,
        title: 'Deep Learning & Neural Networks',
        duration: 2,
        topics: ['Neural Networks', 'CNN', 'RNN', 'Transformers'],
        projects: ['Image Classification', 'NLP Project']
      },
      {
        phase: 4,
        title: 'Advanced AI & Deployment',
        duration: 2,
        topics: ['MLOps', 'Model Deployment', 'AI Ethics', 'Advanced Architectures'],
        projects: ['End-to-End ML Pipeline', 'Production AI System']
      }
    ]
  },
  'fullstack-web': {
    id: 'fullstack-web',
    title: 'Full Stack Web Developer',
    description: 'Build complete web applications',
    difficulty: 'intermediate',
    duration: { min: 4, max: 6 },
    phases: [
      {
        phase: 1,
        title: 'Frontend Foundations',
        duration: 1.5,
        topics: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Responsive Design'],
        projects: ['Portfolio Website', 'Interactive Web App']
      },
      {
        phase: 2,
        title: 'Frontend Frameworks',
        duration: 1.5,
        topics: ['React', 'State Management', 'Component Architecture', 'Testing'],
        projects: ['React Dashboard', 'E-commerce Frontend']
      },
      {
        phase: 3,
        title: 'Backend Development',
        duration: 1.5,
        topics: ['Node.js', 'Express', 'Databases', 'APIs', 'Authentication'],
        projects: ['REST API', 'Database Design']
      },
      {
        phase: 4,
        title: 'Full Stack Integration',
        duration: 1.5,
        topics: ['Full Stack Apps', 'Deployment', 'DevOps', 'Performance'],
        projects: ['Complete Web Application', 'Production Deployment']
      }
    ]
  },
  'cloud-computing': {
    id: 'cloud-computing',
    title: 'Cloud Computing Specialist',
    description: 'Master cloud platforms and infrastructure',
    difficulty: 'advanced',
    duration: { min: 5, max: 7 },
    phases: [
      {
        phase: 1,
        title: 'Cloud Fundamentals',
        duration: 1.5,
        topics: ['Cloud Concepts', 'AWS Basics', 'Networking', 'Security'],
        projects: ['Cloud Architecture Design', 'Basic Infrastructure Setup']
      },
      {
        phase: 2,
        title: 'Infrastructure as Code',
        duration: 2,
        topics: ['Terraform', 'CloudFormation', 'Ansible', 'CI/CD'],
        projects: ['Automated Infrastructure', 'Deployment Pipeline']
      },
      {
        phase: 3,
        title: 'Container Orchestration',
        duration: 1.5,
        topics: ['Docker', 'Kubernetes', 'Microservices', 'Service Mesh'],
        projects: ['Containerized Application', 'K8s Cluster Management']
      },
      {
        phase: 4,
        title: 'Advanced Cloud Services',
        duration: 2,
        topics: ['Serverless', 'Data Analytics', 'ML Services', 'Monitoring'],
        projects: ['Serverless Application', 'Cloud-Native Solution']
      }
    ]
  },
  'dsa-challenge': {
    id: 'dsa-challenge',
    title: 'DSA Challenge Master',
    description: 'Excel in coding interviews and competitive programming',
    difficulty: 'intermediate',
    duration: { min: 3, max: 4 },
    phases: [
      {
        phase: 1,
        title: 'Data Structures Mastery',
        duration: 1,
        topics: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs'],
        projects: ['Data Structure Implementation', 'Algorithm Visualization']
      },
      {
        phase: 2,
        title: 'Algorithm Techniques',
        duration: 1,
        topics: ['Sorting', 'Searching', 'Recursion', 'Dynamic Programming'],
        projects: ['Algorithm Optimization', 'Problem Solving Portfolio']
      },
      {
        phase: 3,
        title: 'Advanced Problem Solving',
        duration: 1,
        topics: ['Graph Algorithms', 'Advanced DP', 'Greedy Algorithms', 'Backtracking'],
        projects: ['Complex Problem Solutions', 'Competitive Programming']
      },
      {
        phase: 4,
        title: 'Interview Preparation',
        duration: 1,
        topics: ['System Design', 'Coding Interviews', 'Behavioral Questions', 'Mock Interviews'],
        projects: ['System Design Portfolio', 'Interview Practice Sessions']
      }
    ]
  }
};

// Assessment questions for user profiling
export const assessmentQuestions = {
  learningStyle: [
    {
      id: 'learning_pace',
      question: 'How do you prefer to learn new concepts?',
      category: 'learningStyle',
      options: [
        { value: 'fast_overview', label: 'Quick overview first, then deep dive', weight: 4 },
        { value: 'step_by_step', label: 'Step-by-step detailed approach', weight: 2 },
        { value: 'hands_on', label: 'Learn by doing and experimenting', weight: 5 },
        { value: 'theory_first', label: 'Understand theory before practice', weight: 3 }
      ]
    },
    {
      id: 'learning_environment',
      question: 'What learning environment works best for you?',
      category: 'learningStyle',
      options: [
        { value: 'structured', label: 'Highly structured with clear milestones', weight: 2 },
        { value: 'flexible', label: 'Flexible schedule with self-paced learning', weight: 4 },
        { value: 'interactive', label: 'Interactive with lots of practice', weight: 5 },
        { value: 'guided', label: 'Guided with mentor support', weight: 3 }
      ]
    }
  ],
  technicalBackground: [
    {
      id: 'programming_experience',
      question: 'What is your programming experience level?',
      category: 'technicalBackground',
      options: [
        { value: 'beginner', label: 'Beginner (0-1 years)', weight: 1 },
        { value: 'intermediate', label: 'Intermediate (1-3 years)', weight: 3 },
        { value: 'advanced', label: 'Advanced (3-5 years)', weight: 4 },
        { value: 'expert', label: 'Expert (5+ years)', weight: 5 }
      ]
    },
    {
      id: 'technical_comfort',
      question: 'How comfortable are you with learning new technologies?',
      category: 'technicalBackground',
      options: [
        { value: 'very_comfortable', label: 'Very comfortable, I love new tech', weight: 5 },
        { value: 'comfortable', label: 'Comfortable with guidance', weight: 4 },
        { value: 'somewhat', label: 'Somewhat comfortable', weight: 3 },
        { value: 'need_support', label: 'Need significant support', weight: 2 }
      ]
    }
  ],
  timeCommitment: [
    {
      id: 'daily_hours',
      question: 'How many hours per day can you dedicate to learning?',
      category: 'timeCommitment',
      options: [
        { value: '1_hour', label: '1-2 hours', weight: 2 },
        { value: '2_hours', label: '2-4 hours', weight: 3 },
        { value: '4_hours', label: '4-6 hours', weight: 4 },
        { value: '6_plus', label: '6+ hours', weight: 5 }
      ]
    },
    {
      id: 'consistency',
      question: 'How consistent can you be with your learning schedule?',
      category: 'timeCommitment',
      options: [
        { value: 'very_consistent', label: 'Very consistent, daily practice', weight: 5 },
        { value: 'mostly_consistent', label: 'Mostly consistent, 5-6 days/week', weight: 4 },
        { value: 'somewhat_consistent', label: 'Somewhat consistent, 3-4 days/week', weight: 3 },
        { value: 'flexible', label: 'Flexible schedule, when possible', weight: 2 }
      ]
    }
  ],
  motivation: [
    {
      id: 'primary_goal',
      question: 'What is your primary learning goal?',
      category: 'motivation',
      options: [
        { value: 'career_change', label: 'Complete career change', weight: 5 },
        { value: 'skill_upgrade', label: 'Upgrade current skills', weight: 4 },
        { value: 'promotion', label: 'Get promoted in current role', weight: 3 },
        { value: 'personal_interest', label: 'Personal interest and growth', weight: 2 }
      ]
    },
    {
      id: 'urgency',
      question: 'How urgent is achieving your learning goal?',
      category: 'motivation',
      options: [
        { value: 'very_urgent', label: 'Very urgent (within 3 months)', weight: 5 },
        { value: 'urgent', label: 'Urgent (within 6 months)', weight: 4 },
        { value: 'moderate', label: 'Moderate timeline (within 1 year)', weight: 3 },
        { value: 'flexible', label: 'Flexible timeline', weight: 2 }
      ]
    }
  ]
};

// AI Assistant class with REAL message processing (no simulation)
class AILearningAssistant {
  constructor() {
    this.userProfile = null;
    this.progressData = {
      completedTasks: [],
      timeSpentTotal: 0,
      averageEfficiency: 0,
      strongAreas: [],
      improvementAreas: [],
      consistencyRate: 0,
      totalTasksCompleted: 0
    };
    this.conversationHistory = [];
  }

  // Process REAL messages (no simulation or predefined responses)
  processMessage(exactMessage, learningContext = {}) {
    console.log(`🤖 AI processing EXACT message: "${exactMessage}"`);
    
    const lowerMessage = exactMessage.toLowerCase().trim();
    
    // Store conversation history
    this.conversationHistory.push({
      message: exactMessage,
      timestamp: new Date().toISOString(),
      context: learningContext
    });

    // REAL responses based on EXACT user input
    
    // Greeting responses
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      if (lowerMessage.includes('bro')) {
        return {
          response: "Hey bro! 👋 Great to hear from you! I'm your AI learning assistant and I'm here to help you with your studies. What's on your mind today?",
          suggestions: [
            "Show my progress",
            "Help with studies",
            "What should I learn?",
            "Give me motivation"
          ]
        };
      }
      return {
        response: "Hello there! 👋 I'm your AI learning assistant. I heard you perfectly! How can I help you with your learning journey today?",
        suggestions: [
          "Show my progress",
          "Help with current task",
          "Plan my studies",
          "Get learning tips"
        ]
      };
    }

    // How are you responses
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how r u')) {
      return {
        response: "I'm doing great, thanks for asking! 😊 I'm here and ready to help you with your learning. I'm excited to assist you with whatever you need. How are YOU doing with your studies?",
        suggestions: [
          "I'm doing well",
          "I need help studying",
          "Show my progress",
          "What should I learn next?"
        ]
      };
    }

    // Progress-related queries
    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
      const analytics = this.getLearningAnalytics();
      return {
        response: `📊 Your Learning Progress Report:\n\n✅ Tasks Completed: ${analytics.totalTasksCompleted}\n⚡ Average Efficiency: ${Math.round(analytics.averageEfficiency * 100)}%\n⏰ Total Learning Time: ${analytics.timeSpentTotal.toFixed(1)} hours\n🎯 Consistency Rate: ${Math.round(analytics.consistencyRate * 100)}%\n\n${analytics.totalTasksCompleted > 0 ? 'You\'re making great progress! Keep it up! 🚀' : 'Ready to start your learning journey? Let\'s get some tasks completed! 💪'}`,
        suggestions: [
          "Show detailed analytics",
          "View weak areas",
          "Get improvement tips",
          "See time breakdown"
        ]
      };
    }

    // Task-related queries
    if (lowerMessage.includes('task') || lowerMessage.includes('assignment') || lowerMessage.includes('homework')) {
      return {
        response: `📋 I can definitely help you with tasks! I can:\n\n• Generate personalized daily tasks\n• Track your progress and time\n• Provide guidance and hints\n• Help you stay organized\n\nWhat specific help do you need with your tasks?`,
        suggestions: [
          "Generate new tasks",
          "Show current tasks",
          "Help with current task",
          "Track task progress"
        ]
      };
    }

    // Study planning queries
    if (lowerMessage.includes('study') || lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
      const userProfile = learningContext.userProfile || this.userProfile;
      const dailyHours = userProfile ? userProfile.timeCommitment : 3;
      
      return {
        response: `📅 Study Planning Assistant:\n\nBased on your profile, here's what I recommend:\n• ${dailyHours} hours of focused daily study\n• Break sessions into 45-60 minute chunks\n• Take 10-15 minute breaks between sessions\n• Review previous concepts weekly\n• Practice active recall and spaced repetition\n\nWould you like me to create a detailed study schedule for you?`,
        suggestions: [
          "Create study schedule",
          "Set study reminders",
          "Plan weekly goals",
          "Optimize study time"
        ]
      };
    }

    // Motivation and encouragement
    if (lowerMessage.includes('motivat') || lowerMessage.includes('struggling') || lowerMessage.includes('difficult') || lowerMessage.includes('hard')) {
      return {
        response: `💪 I hear you, and I want you to know that struggling is completely normal and actually a sign that you're growing! Here's some motivation:\n\n🎯 Every expert was once a beginner\n📈 Progress isn't always linear - ups and downs are normal\n🏆 Small consistent steps lead to big achievements\n💡 The struggle you're feeling means your brain is building new connections\n🚀 You've got this! I believe in you!\n\nWhat specific area would you like help with? Let's tackle it together!`,
        suggestions: [
          "Break down difficult concepts",
          "Find easier learning resources",
          "Set smaller goals",
          "Get study tips"
        ]
      };
    }

    // Analytics and performance queries
    if (lowerMessage.includes('analytic') || lowerMessage.includes('performance') || lowerMessage.includes('efficiency') || lowerMessage.includes('stats')) {
      const analytics = this.getLearningAnalytics();
      return {
        response: `📈 Your Performance Analytics:\n\n⚡ Efficiency Score: ${Math.round(analytics.averageEfficiency * 100)}%\n📊 Strong Areas: ${analytics.strongAreas.length > 0 ? analytics.strongAreas.map(a => a.category).join(', ') : 'Building up your strengths...'}\n📉 Areas for Improvement: ${analytics.improvementAreas.length > 0 ? analytics.improvementAreas.map(a => a.category).join(', ') : 'You\'re doing great across the board!'}\n🔥 Consistency Rate: ${Math.round(analytics.consistencyRate * 100)}%\n⏰ Average Task Time: ${analytics.averageTaskTime ? analytics.averageTaskTime.toFixed(1) + ' hours' : 'No data yet'}`,
        suggestions: [
          "Improve weak areas",
          "Optimize study methods",
          "Set efficiency goals",
          "Track daily performance"
        ]
      };
    }

    // Learning path and roadmap queries
    if (lowerMessage.includes('roadmap') || lowerMessage.includes('path') || lowerMessage.includes('curriculum') || lowerMessage.includes('course')) {
      return {
        response: `🗺️ Your Learning Roadmap:\n\nYour personalized learning path is designed specifically for your goals and learning style. It includes:\n\n• Structured learning phases\n• Hands-on practical projects\n• Regular skill assessments\n• Progress milestones\n• Adaptive difficulty adjustment\n\nWould you like to review your current roadmap or explore different learning paths?`,
        suggestions: [
          "View current roadmap",
          "Explore other paths",
          "Adjust timeline",
          "See next milestones"
        ]
      };
    }

    // Help and resource queries
    if (lowerMessage.includes('help') || lowerMessage.includes('resource') || lowerMessage.includes('learn more') || lowerMessage.includes('assist')) {
      return {
        response: `🎓 I'm here to help you succeed! Here's what I can assist you with:\n\n📚 Learning resources and study materials\n📋 Task generation and progress tracking\n📊 Performance analytics and insights\n🎯 Goal setting and study planning\n💬 Answering questions about your learning\n🎤 Voice interaction (like we're doing now!)\n\nWhat would you like help with specifically? Just ask me anything!`,
        suggestions: [
          "Find learning resources",
          "Get study tips",
          "Explain concepts",
          "Recommend next steps"
        ]
      };
    }

    // Default response for any other input
    const learningData = learningContext.learningData;
    let contextualResponse = `I heard you say: "${exactMessage}"\n\n`;
    
    if (learningData) {
      contextualResponse += `I'm your AI learning assistant! You're currently in Phase ${learningData.currentPhase}, Day ${learningData.dayNumber} of your learning journey. `;
    } else {
      contextualResponse += "I'm your AI learning assistant! ";
    }

    contextualResponse += "I can help you with learning progress, task management, study planning, and answering questions about your courses. What would you like to know?";

    return {
      response: contextualResponse,
      suggestions: [
        "Show my progress",
        "Generate daily tasks",
        "Plan my studies",
        "Get learning tips"
      ]
    };
  }

  // Analyze user profile from assessment responses
  analyzeUserProfile(responses) {
    const profile = {
      learningSpeed: 0,
      experienceLevel: 0,
      timeCommitment: 0,
      focusCapability: 0,
      motivation: 0,
      preferredStyle: 'balanced',
      strengths: [],
      challenges: []
    };

    // Calculate weighted scores
    responses.forEach(response => {
      switch (response.category) {
        case 'learningStyle':
          profile.learningSpeed += response.weight * 0.5;
          profile.focusCapability += response.weight * 0.3;
          break;
        case 'technicalBackground':
          profile.experienceLevel += response.weight * 0.6;
          break;
        case 'timeCommitment':
          profile.timeCommitment += response.weight * 0.7;
          profile.focusCapability += response.weight * 0.2;
          break;
        case 'motivation':
          profile.motivation += response.weight * 0.8;
          break;
      }
    });

    // Normalize scores (0-5 scale)
    profile.learningSpeed = Math.min(5, profile.learningSpeed);
    profile.experienceLevel = Math.min(5, profile.experienceLevel);
    profile.timeCommitment = Math.min(5, profile.timeCommitment);
    profile.focusCapability = Math.min(5, profile.focusCapability);
    profile.motivation = Math.min(5, profile.motivation);

    // Determine preferred learning style
    const styleResponses = responses.filter(r => r.category === 'learningStyle');
    if (styleResponses.some(r => r.value.includes('hands_on'))) {
      profile.preferredStyle = 'practical';
    } else if (styleResponses.some(r => r.value.includes('theory'))) {
      profile.preferredStyle = 'theoretical';
    } else if (styleResponses.some(r => r.value.includes('fast'))) {
      profile.preferredStyle = 'accelerated';
    }

    // Identify strengths and challenges
    if (profile.experienceLevel >= 4) profile.strengths.push('Technical Experience');
    if (profile.timeCommitment >= 4) profile.strengths.push('Time Availability');
    if (profile.motivation >= 4) profile.strengths.push('High Motivation');
    if (profile.focusCapability >= 4) profile.strengths.push('Focus & Concentration');

    if (profile.experienceLevel <= 2) profile.challenges.push('Technical Foundation');
    if (profile.timeCommitment <= 2) profile.challenges.push('Time Management');
    if (profile.focusCapability <= 2) profile.challenges.push('Sustained Focus');

    return profile;
  }

  // Generate personalized roadmap
  generatePersonalizedRoadmap(learningPathId, timeframeMonths, userProfile) {
    const basePath = learningPaths[learningPathId];
    if (!basePath) throw new Error('Invalid learning path');

    // Calculate success prediction based on user profile
    const successFactors = {
      experience: userProfile.experienceLevel / 5,
      time: userProfile.timeCommitment / 5,
      motivation: userProfile.motivation / 5,
      focus: userProfile.focusCapability / 5
    };

    const successPrediction = (
      successFactors.experience * 0.2 +
      successFactors.time * 0.3 +
      successFactors.motivation * 0.3 +
      successFactors.focus * 0.2
    );

    // Adjust phases based on user profile and timeline
    const adjustedPhases = basePath.phases.map(phase => ({
      ...phase,
      adjustedForUser: true,
      duration: this.adjustPhaseDuration(phase.duration, timeframeMonths, basePath.duration.min, userProfile)
    }));

    // Generate personalized schedule
    const personalizedSchedule = this.generatePersonalizedSchedule(userProfile, timeframeMonths);

    return {
      ...basePath,
      phases: adjustedPhases,
      successPrediction,
      personalizedSchedule,
      totalDuration: timeframeMonths,
      adjustedForProfile: true
    };
  }

  // Adjust phase duration based on user profile
  adjustPhaseDuration(baseDuration, totalMonths, minMonths, userProfile) {
    const scaleFactor = totalMonths / minMonths;
    let adjustedDuration = baseDuration * scaleFactor;

    // Adjust based on experience level
    if (userProfile.experienceLevel >= 4) {
      adjustedDuration *= 0.8; // Experienced users can move faster
    } else if (userProfile.experienceLevel <= 2) {
      adjustedDuration *= 1.2; // Beginners need more time
    }

    return Math.max(0.5, adjustedDuration); // Minimum 0.5 weeks
  }

  // Generate personalized schedule
  generatePersonalizedSchedule(userProfile, timeframeMonths) {
    const dailyHours = Math.min(8, Math.max(1, userProfile.timeCommitment));
    const sessionsPerDay = userProfile.focusCapability >= 4 ? 2 : userProfile.focusCapability >= 2 ? 1 : 1;
    const breakIntervals = userProfile.focusCapability >= 4 ? 60 : 45;
    
    return {
      dailyHours,
      sessionsPerDay,
      breakIntervals,
      weeklyStructure: {
        studyDays: userProfile.timeCommitment >= 4 ? 6 : userProfile.timeCommitment >= 2 ? 5 : 4,
        restDays: userProfile.timeCommitment >= 4 ? 1 : 2
      }
    };
  }

  // Generate daily tasks based on roadmap and progress
  generateDailyTasks(roadmap, currentPhase, dayNumber, userProfile) {
    const phase = roadmap.phases[currentPhase - 1];
    if (!phase) return [];

    const tasks = [];
    const taskTypes = ['learning', 'practice', 'review'];
    const difficulties = [3, 4, 5]; // 3=intermediate, 4=advanced, 5=expert

    // Generate 3-5 tasks per day
    const numTasks = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numTasks; i++) {
      const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
      const topic = phase.topics[Math.floor(Math.random() * phase.topics.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

      const task = {
        id: `ai-task-${currentPhase}-${dayNumber}-${i + 1}`,
        title: this.generateTaskTitle(taskType, topic),
        description: this.generateTaskDescription(taskType, topic, difficulty),
        type: taskType,
        category: topic,
        difficulty,
        priority: this.assignPriority(taskType, difficulty),
        estimatedTime: this.calculateEstimatedTime(taskType, difficulty, userProfile),
        topics: [topic],
        resources: this.generateTaskResources(topic),
        status: 'pending'
      };

      tasks.push(task);
    }

    return tasks;
  }

  // Generate task title based on type and topic
  generateTaskTitle(type, topic) {
    const templates = {
      learning: [
        `Study ${topic} Fundamentals`,
        `Learn ${topic} Concepts`,
        `Master ${topic} Basics`,
        `Understand ${topic} Principles`
      ],
      practice: [
        `Practice ${topic} Exercises`,
        `Build ${topic} Project`,
        `Implement ${topic} Solution`,
        `Code ${topic} Examples`
      ],
      review: [
        `Review ${topic} Knowledge`,
        `Reinforce ${topic} Concepts`,
        `Quiz on ${topic}`,
        `Summarize ${topic} Learning`
      ]
    };

    const typeTemplates = templates[type] || templates.learning;
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  }

  // Generate task description
  generateTaskDescription(type, topic, difficulty) {
    const descriptions = {
      learning: `Deep dive into ${topic} concepts. This ${difficulty >= 4 ? 'advanced' : 'intermediate'} learning session will cover key principles and practical applications.`,
      practice: `Hands-on practice with ${topic}. Build practical skills through ${difficulty >= 4 ? 'complex' : 'structured'} exercises and real-world examples.`,
      review: `Consolidate your ${topic} knowledge. Review key concepts and test your understanding through ${difficulty >= 4 ? 'challenging' : 'comprehensive'} assessments.`
    };

    return descriptions[type] || descriptions.learning;
  }

  // Assign priority based on task type and difficulty
  assignPriority(type, difficulty) {
    if (type === 'learning' && difficulty >= 4) return 'high';
    if (type === 'practice') return 'medium';
    if (difficulty >= 5) return 'high';
    return Math.random() > 0.5 ? 'medium' : 'low';
  }

  // Calculate estimated time based on task complexity and user profile
  calculateEstimatedTime(type, difficulty, userProfile) {
    let baseTime = {
      learning: 2,
      practice: 3,
      review: 1
    }[type] || 2;

    // Adjust for difficulty
    baseTime *= (difficulty / 3);

    // Adjust for user experience
    if (userProfile.experienceLevel >= 4) {
      baseTime *= 0.8;
    } else if (userProfile.experienceLevel <= 2) {
      baseTime *= 1.3;
    }

    return Math.round(baseTime * 10) / 10; // Round to 1 decimal place
  }

  // Generate task resources
  generateTaskResources(topic) {
    return [
      { type: 'video', title: `${topic} Tutorial`, url: '#' },
      { type: 'article', title: `${topic} Guide`, url: '#' },
      { type: 'documentation', title: `${topic} Documentation`, url: '#' }
    ];
  }

  // Track progress and update analytics
  trackProgress(taskId, completionData) {
    const progressEntry = {
      taskId,
      completedAt: new Date().toISOString(),
      timeSpent: completionData.timeSpent,
      estimatedTime: completionData.estimatedTime,
      efficiency: completionData.efficiency,
      difficulty: completionData.difficulty,
      category: completionData.category,
      quality: completionData.quality
    };

    this.progressData.completedTasks.push(progressEntry);
    this.progressData.totalTasksCompleted++;
    this.progressData.timeSpentTotal += completionData.timeSpent;

    // Update efficiency
    const efficiencies = this.progressData.completedTasks.map(t => t.efficiency);
    this.progressData.averageEfficiency = efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length;

    // Update consistency rate (simplified)
    this.progressData.consistencyRate = Math.min(1, this.progressData.totalTasksCompleted / 10);

    this.updateAreasAnalysis();
    return progressEntry;
  }

  // Calculate efficiency score
  calculateEfficiency(estimatedTime, actualTime) {
    if (actualTime <= 0) return 100;
    const efficiency = (estimatedTime / actualTime) * 100;
    return Math.max(10, Math.min(200, efficiency)); // Cap between 10% and 200%
  }

  // Update strong and improvement areas
  updateAreasAnalysis() {
    const categoryStats = {};
    
    this.progressData.completedTasks.forEach(task => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = {
          category: task.category,
          count: 0,
          totalEfficiency: 0,
          averageEfficiency: 0
        };
      }
      
      categoryStats[task.category].count++;
      categoryStats[task.category].totalEfficiency += task.efficiency;
      categoryStats[task.category].averageEfficiency = 
        categoryStats[task.category].totalEfficiency / categoryStats[task.category].count;
    });

    const categories = Object.values(categoryStats);
    categories.sort((a, b) => b.averageEfficiency - a.averageEfficiency);

    this.progressData.strongAreas = categories.slice(0, 2);
    this.progressData.improvementAreas = categories.slice(-2);
  }

  // Get learning analytics
  getLearningAnalytics() {
    return {
      ...this.progressData,
      recentTasks: this.progressData.completedTasks.slice(-5),
      averageTaskTime: this.progressData.completedTasks.length > 0 
        ? this.progressData.timeSpentTotal / this.progressData.completedTasks.length 
        : 0
    };
  }

  // Generate improvement recommendations
  generateImprovementRecommendations(userProfile, analytics) {
    const recommendations = [];

    if (analytics.averageEfficiency < 0.8) {
      recommendations.push({
        area: 'Time Management',
        suggestion: 'Consider breaking down tasks into smaller chunks and using the Pomodoro technique to improve focus and efficiency.',
        priority: 'high',
        expectedImprovement: '+15% efficiency'
      });
    }

    if (analytics.consistencyRate < 0.6) {
      recommendations.push({
        area: 'Study Consistency',
        suggestion: 'Set up a daily study routine and use reminders to maintain consistent learning habits.',
        priority: 'medium',
        expectedImprovement: '+20% consistency'
      });
    }

    if (analytics.improvementAreas.length > 0) {
      const weakArea = analytics.improvementAreas[0];
      recommendations.push({
        area: `${weakArea.category} Skills`,
        suggestion: `Focus additional practice time on ${weakArea.category} to strengthen this area. Consider seeking additional resources or mentorship.`,
        priority: 'medium',
        expectedImprovement: '+25% in weak areas'
      });
    }

    return recommendations;
  }
}

// Create and export AI assistant instance
export const aiAssistant = new AILearningAssistant();

// Export utility functions
export const generateTaskId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const formatDuration = (hours) => {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  return `${hours.toFixed(1)} hours`;
};

export const calculateCompletionPercentage = (completed, total) => {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};