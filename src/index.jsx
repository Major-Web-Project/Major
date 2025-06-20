import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { FrameScreen } from "./screens/FrameScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { TasksScreen } from "./screens/TasksScreen";
import { AboutScreen } from "./screens/AboutScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { AssessmentScreen } from "./screens/AssessmentScreen";
import { GoalSetupScreen } from "./screens/GoalSetupScreen";
import { RoadmapScreen } from "./screens/RoadmapScreen";
import { LearningDashboardScreen } from "./screens/LearningDashboardScreen";
import { aiAssistant } from "./services/aiLearningService";

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [userProfile, setUserProfile] = useState(null);
  const [goalData, setGoalData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [learningData, setLearningData] = useState({ 
    completedTasks: [], 
    totalTasksCompleted: 0, 
    currentPhase: 1, 
    dayNumber: 1 
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [aiTasksData, setAiTasksData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // Make learning context available globally for AI chat
  useEffect(() => {
    window.learningData = learningData;
    window.userProfile = userProfile;
    window.currentProgress = aiAssistant.progressData;
  }, [learningData, userProfile]);

  useEffect(() => {
    const handleNavigateToHome = () => setCurrentScreen('home');
    const handleNavigateToDashboard = () => setCurrentScreen('dashboard');
    const handleNavigateToLearningDashboard = () => {
      if (learningData && learningData.completedTasks && learningData.completedTasks.length > 0) {
        setCurrentScreen('learning-dashboard');
      } else {
        // If no learning data, redirect to assessment
        setCurrentScreen('assessment');
      }
    };
    const handleNavigateToTasks = () => setCurrentScreen('tasks');
    const handleNavigateToAbout = () => setCurrentScreen('about');
    const handleNavigateToAuth = () => setCurrentScreen('auth');
    const handleNavigateToAssessment = () => setCurrentScreen('assessment');

    // Add event listeners for navigation
    window.addEventListener('navigateToHome', handleNavigateToHome);
    window.addEventListener('navigateToDashboard', handleNavigateToDashboard);
    window.addEventListener('navigateToLearningDashboard', handleNavigateToLearningDashboard);
    window.addEventListener('navigateToTasks', handleNavigateToTasks);
    window.addEventListener('navigateToAbout', handleNavigateToAbout);
    window.addEventListener('navigateToAuth', handleNavigateToAuth);
    window.addEventListener('navigateToAssessment', handleNavigateToAssessment);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('navigateToHome', handleNavigateToHome);
      window.removeEventListener('navigateToDashboard', handleNavigateToDashboard);
      window.removeEventListener('navigateToLearningDashboard', handleNavigateToLearningDashboard);
      window.removeEventListener('navigateToTasks', handleNavigateToTasks);
      window.removeEventListener('navigateToAbout', handleNavigateToAbout);
      window.removeEventListener('navigateToAuth', handleNavigateToAuth);
      window.removeEventListener('navigateToAssessment', handleNavigateToAssessment);
    };
  }, [learningData]);

  const handleAssessmentComplete = (profile, responses) => {
    setUserProfile(profile);
    setCurrentScreen('goal-setup');
  };

  const handleGoalSetupComplete = (goal, generatedRoadmap) => {
    setGoalData(goal);
    setRoadmap(generatedRoadmap);
    setCurrentScreen('roadmap');
  };

  const handleStartLearning = (data) => {
    setLearningData(data);
    setIsAuthenticated(true);
    
    // Generate initial AI tasks and dashboard data
    const initialTasks = aiAssistant.generateDailyTasks(
      data.roadmap,
      data.currentPhase || 1,
      data.dayNumber || 1,
      data.userProfile
    );
    setAiTasksData(initialTasks);
    
    // Generate dashboard data with AI analytics
    const analytics = aiAssistant.getLearningAnalytics();
    setDashboardData({
      ...analytics,
      currentCourse: data.goalData?.learningPath,
      roadmap: data.roadmap,
      userProfile: data.userProfile
    });
    
    // Redirect to AI learning dashboard
    setCurrentScreen('learning-dashboard');
  };

  const handleTaskComplete = (progressEntry) => {
    console.log('Task completed:', progressEntry);
    // Update learning analytics with AI assistant
    aiAssistant.trackProgress(progressEntry.taskId, progressEntry);
    
    // Update learning data with new progress
    setLearningData(prev => ({
      ...prev,
      completedTasks: [...(prev.completedTasks || []), progressEntry],
      totalTasksCompleted: (prev.totalTasksCompleted || 0) + 1
    }));

    // Update dashboard data
    const updatedAnalytics = aiAssistant.getLearningAnalytics();
    setDashboardData(prev => ({
      ...prev,
      ...updatedAnalytics
    }));

    // Generate new tasks if needed
    if (learningData && userProfile && roadmap) {
      const newTasks = aiAssistant.generateDailyTasks(
        roadmap,
        learningData.currentPhase || 1,
        (learningData.dayNumber || 1) + 1,
        userProfile
      );
      setAiTasksData(prev => [...prev, ...newTasks]);
    }
  };

  const handleUpdateProgress = (updates) => {
    setLearningData(prev => ({ ...prev, ...updates }));
    
    // Update dashboard data when progress changes
    const analytics = aiAssistant.getLearningAnalytics();
    setDashboardData(prev => ({
      ...prev,
      ...analytics
    }));
  };

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');
  };

  // Render the appropriate screen based on current state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <FrameScreen />;
      case 'dashboard':
        return (
          <DashboardScreen 
            userProfile={userProfile} 
            learningData={learningData}
            dashboardData={dashboardData}
            aiTasksData={aiTasksData}
          />
        );
      case 'learning-dashboard':
        return (
          <LearningDashboardScreen 
            learningData={learningData}
            userProfile={userProfile}
            roadmap={roadmap}
            dashboardData={dashboardData}
            aiTasksData={aiTasksData}
            onTaskComplete={handleTaskComplete}
            onUpdateProgress={handleUpdateProgress}
          />
        );
      case 'tasks':
        return (
          <TasksScreen 
            userProfile={userProfile} 
            learningData={learningData}
            aiTasksData={aiTasksData}
            roadmap={roadmap}
            goalData={goalData}
            onTaskComplete={handleTaskComplete}
          />
        );
      case 'about':
        return <AboutScreen />;
      case 'auth':
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
      case 'assessment':
        return <AssessmentScreen onComplete={handleAssessmentComplete} />;
      case 'goal-setup':
        return <GoalSetupScreen userProfile={userProfile} onComplete={handleGoalSetupComplete} />;
      case 'roadmap':
        return <RoadmapScreen 
          goalData={goalData} 
          roadmap={roadmap} 
          userProfile={userProfile}
          onStartLearning={handleStartLearning} 
        />;
      default:
        return <FrameScreen />;
    }
  };

  return renderScreen();
};

// Get the root element and ensure it exists
const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Root element with id 'app' not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);