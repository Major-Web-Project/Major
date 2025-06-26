import React, { useState, useEffect } from 'react';
import './index.css';
import { FrameScreen } from './screens/FrameScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TasksScreen } from './screens/TasksScreen';
import { AboutScreen } from './screens/AboutScreen';
import { AuthScreen } from './screens/AuthScreen';
import { AssessmentScreen } from './screens/AssessmentScreen';
import { GoalSetupScreen } from './screens/GoalSetupScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { LearningDashboardScreen } from './screens/LearningDashboardScreen';
import { aiAssistant } from './services/aiLearningService';

function App() {
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
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);

  // Make learning context available globally for AI chat
  useEffect(() => {
    window.learningData = learningData;
    window.userProfile = userProfile;
    window.currentProgress = aiAssistant.progressData;
  }, [learningData, userProfile]);

  useEffect(() => {
    const handleNavigateToHome = () => setCurrentScreen('home');
    const handleNavigateToDashboard = () => setCurrentScreen('dashboard');
    
    // FIXED: Improved Learning Dashboard Navigation Logic
    const handleNavigateToLearningDashboard = () => {
      console.log('🔍 Learning Dashboard Navigation Check:', {
        hasCompletedAssessment,
        hasUserProfile: !!userProfile,
        hasGoalData: !!goalData,
        hasRoadmap: !!roadmap,
        hasLearningData: !!(learningData && learningData.roadmap),
        aiTasksDataLength: aiTasksData?.length || 0
      });

      // Check if user has completed the full learning setup process
      const hasFullLearningSetup = userProfile && goalData && roadmap && 
        (learningData.roadmap || aiTasksData?.length > 0);

      if (hasFullLearningSetup) {
        // User has completed assessment and setup - show AI learning dashboard
        console.log('✅ Showing AI Learning Dashboard - user has completed setup');
        setCurrentScreen('learning-dashboard');
      } else if (userProfile && goalData && roadmap) {
        // User has profile and goal but no learning data yet - show roadmap to start learning
        console.log('📋 Showing Roadmap - user needs to start learning');
        setCurrentScreen('roadmap');
      } else if (userProfile && goalData) {
        // User has profile but no roadmap - shouldn't happen, but handle gracefully
        console.log('⚠️ User has profile and goal but no roadmap - redirecting to goal setup');
        setCurrentScreen('goal-setup');
      } else if (userProfile) {
        // User has completed assessment but no goal - go to goal setup
        console.log('🎯 User has profile but no goal - redirecting to goal setup');
        setCurrentScreen('goal-setup');
      } else {
        // User hasn't completed assessment yet - start assessment
        console.log('📝 No user profile - starting assessment');
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
      window.removeEventListener('navigateToHome', handleNavigateToHome);
      window.removeEventListener('navigateToDashboard', handleNavigateToDashboard);
      window.removeEventListener('navigateToLearningDashboard', handleNavigateToLearningDashboard);
      window.removeEventListener('navigateToTasks', handleNavigateToTasks);
      window.removeEventListener('navigateToAbout', handleNavigateToAbout);
      window.removeEventListener('navigateToAuth', handleNavigateToAuth);
      window.removeEventListener('navigateToAssessment', handleNavigateToAssessment);
    };
  }, [userProfile, goalData, roadmap, learningData, aiTasksData, hasCompletedAssessment]);

  const handleAssessmentComplete = (profile, responses) => {
    console.log('✅ Assessment completed:', profile);
    setUserProfile(profile);
    setHasCompletedAssessment(true);
    setCurrentScreen('goal-setup');
  };

  const handleGoalSetupComplete = (goal, generatedRoadmap) => {
    console.log('✅ Goal setup completed:', { goal, generatedRoadmap });
    setGoalData(goal);
    setRoadmap(generatedRoadmap);
    setCurrentScreen('roadmap');
  };

  const handleStartLearning = (data) => {
    console.log('🚀 Starting learning with data:', data);
    
    // Update learning data with all necessary information
    const updatedLearningData = {
      ...learningData,
      ...data,
      roadmap: data.roadmap,
      goalData: data.goalData,
      userProfile: data.userProfile
    };
    
    setLearningData(updatedLearningData);
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
    
    console.log('✅ Learning setup complete - redirecting to AI learning dashboard');
    // Redirect to AI learning dashboard
    setCurrentScreen('learning-dashboard');
  };

  const handleTaskComplete = (progressEntry) => {
    console.log('Task completed:', progressEntry);
    aiAssistant.trackProgress(progressEntry.taskId, progressEntry);
    
    setLearningData(prev => ({
      ...prev,
      completedTasks: [...(prev.completedTasks || []), progressEntry],
      totalTasksCompleted: (prev.totalTasksCompleted || 0) + 1
    }));

    const updatedAnalytics = aiAssistant.getLearningAnalytics();
    setDashboardData(prev => ({
      ...prev,
      ...updatedAnalytics
    }));

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
}

export default App;