// Assessment questions with improved user-friendly options
export const assessmentQuestions = {
  learningStyle: [
    {
      id: "ls1",
      question: "How do you prefer to learn new technologies?",
      category: "learningStyle",
      options: [
        {
          value: "fast_overview",
          label:
            "Quick Overview - I like to get a general understanding first, then dive deeper",
          weight: 1,
        },
        {
          value: "step_by_step",
          label:
            "Step by Step - I prefer structured, sequential learning with clear progression",
          weight: 2,
        },
        {
          value: "hands_on",
          label:
            "Hands-on Practice - I learn best by doing and experimenting with real projects",
          weight: 3,
        },
        {
          value: "theory_first",
          label:
            "Theory First - I need to understand the concepts deeply before applying them",
          weight: 4,
        },
      ],
    },
  ],
  learningFormat: [
    {
      id: "lf1",
      question: "What learning format works best for you?",
      category: "learningFormat",
      options: [
        {
          value: "structured",
          label:
            "Structured Curriculum - I prefer organized courses with clear milestones",
          weight: 1,
        },
        {
          value: "flexible",
          label:
            "Flexible Learning - I like to adapt my learning path based on interests",
          weight: 2,
        },
        {
          value: "interactive",
          label:
            "Interactive Sessions - I learn better with quizzes, exercises, and feedback",
          weight: 3,
        },
        {
          value: "guided",
          label:
            "Guided Projects - I prefer learning through mentored, real-world projects",
          weight: 4,
        },
      ],
    },
  ],
  experienceLevel: [
    {
      id: "el1",
      question: "What's your current technical experience level?",
      category: "experienceLevel",
      options: [
        {
          value: "beginner",
          label: "Beginner - I'm new to programming and technology",
          weight: 1,
        },
        {
          value: "intermediate",
          label:
            "Intermediate - I have some experience with basic programming concepts",
          weight: 2,
        },
        {
          value: "advanced",
          label:
            "Advanced - I'm comfortable with multiple technologies and frameworks",
          weight: 3,
        },
        {
          value: "expert",
          label:
            "Expert - I have extensive experience and can work on complex projects",
          weight: 4,
        },
      ],
    },
  ],
  independence: [
    {
      id: "ind1",
      question: "How comfortable are you with learning independently?",
      category: "independence",
      options: [
        {
          value: "need_support",
          label:
            "Need Support - I prefer constant guidance and regular check-ins",
          weight: 1,
        },
        {
          value: "somewhat",
          label:
            "Somewhat Independent - I can work alone but appreciate occasional guidance",
          weight: 2,
        },
        {
          value: "comfortable",
          label:
            "Comfortable - I'm confident learning on my own with minimal support",
          weight: 3,
        },
        {
          value: "very_comfortable",
          label:
            "Very Independent - I thrive when exploring and learning completely on my own",
          weight: 4,
        },
      ],
    },
  ],
  timeCommitment: [
    {
      id: "tc1",
      question: "How much time can you dedicate to learning daily?",
      category: "timeCommitment",
      options: [
        {
          value: "1_hour",
          label: "1 Hour - I can dedicate about 1 hour per day consistently",
          weight: 1,
        },
        {
          value: "2_hours",
          label:
            "2-3 Hours - I have 2-3 hours available for focused learning daily",
          weight: 2,
        },
        {
          value: "4_hours",
          label:
            "4-5 Hours - I can commit 4-5 hours per day to intensive learning",
          weight: 3,
        },
        {
          value: "6_plus",
          label:
            "6+ Hours - I can dedicate 6 or more hours daily for accelerated learning",
          weight: 4,
        },
      ],
    },
  ],
  consistency: [
    {
      id: "con1",
      question: "How consistent can you be with your study schedule?",
      category: "consistency",
      options: [
        {
          value: "flexible",
          label:
            "Flexible Schedule - My availability varies, I need adaptable learning plans",
          weight: 1,
        },
        {
          value: "somewhat_consistent",
          label:
            "Somewhat Consistent - I can maintain routine most days with some flexibility",
          weight: 2,
        },
        {
          value: "mostly_consistent",
          label:
            "Mostly Consistent - I can stick to a regular schedule with rare exceptions",
          weight: 3,
        },
        {
          value: "very_consistent",
          label:
            "Very Consistent - I can maintain a strict daily learning routine",
          weight: 4,
        },
      ],
    },
  ],
  motivation: [
    {
      id: "mot1",
      question: "What's your primary motivation for this learning path?",
      category: "motivation",
      options: [
        {
          value: "personal_interest",
          label:
            "Personal Interest - I'm learning for curiosity and personal growth",
          weight: 1,
        },
        {
          value: "promotion",
          label:
            "Career Advancement - I want to get promoted in my current role",
          weight: 2,
        },
        {
          value: "skill_upgrade",
          label:
            "Skill Enhancement - I want to improve my current technical abilities",
          weight: 3,
        },
        {
          value: "career_change",
          label:
            "Career Change - I'm transitioning to a completely new field or role",
          weight: 4,
        },
      ],
    },
  ],
};

// Learning paths configuration
export const learningPaths = {
  "ai-ml": {
    id: "ai-ml",
    title: "AI & Machine Learning",
    description:
      "Build intelligent systems and work with artificial intelligence technologies",
    difficulty: "advanced",
    duration: { min: 8, max: 12 },
  },
  "fullstack-web": {
    id: "fullstack-web",
    title: "Full Stack Web Development",
    description: "Create complete web applications from frontend to backend",
    difficulty: "intermediate",
    duration: { min: 6, max: 10 },
  },
  "cloud-computing": {
    id: "cloud-computing",
    title: "Cloud Computing & DevOps",
    description: "Deploy and manage applications in cloud environments",
    difficulty: "intermediate",
    duration: { min: 6, max: 9 },
  },
  "data-science": {
    id: "data-science",
    title: "Data Science & Analytics",
    description: "Extract insights from data and build predictive models",
    difficulty: "intermediate",
    duration: { min: 7, max: 11 },
  },
};

// AI Assistant utilities
export const aiAssistant = {
  async generateRoadmapWithAI(goalData) {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/ai/generate-roadmap`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(goalData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate roadmap");
    }

    const result = await response.json();
    return result.data;
  },
};

export async function saveAssessmentAnswers({
  answers,
  personalize,
  duration,
  path,
  token,
}) {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/assessment/answers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers, personalize, duration, path }),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to save assessment answers");
  }
  return response.json();
}

export const hasActiveGoal = () => {
  const goalData = localStorage.getItem("aiLearning_goalData");
  const roadmap = localStorage.getItem("aiLearning_roadmap");
  return !!(goalData && roadmap);
};

export const getGoalProgress = () => {
  const learningData = JSON.parse(
    localStorage.getItem("aiLearning_learningData") || "{}"
  );
  const roadmap = JSON.parse(
    localStorage.getItem("aiLearning_roadmap") || "{}"
  );

  if (!learningData.currentPhase || !roadmap.phases) {
    return { progress: 0, currentPhase: 1, totalPhases: 0 };
  }

  const totalPhases = roadmap.phases.length;
  const currentPhase = learningData.currentPhase;
  const progress = ((currentPhase - 1) / totalPhases) * 100;

  return {
    progress: Math.round(progress),
    currentPhase,
    totalPhases,
    isCompleted: currentPhase > totalPhases,
  };
};
