import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LearningDashboardScreen from '../components/learning/LearningDashboardScreen';
import { useAuth } from '../hooks/useAuth.js';

const LearningDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [learningData, setLearningData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [roadmap, setRoadmap] = useState(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Load AI learning data from localStorage
    const savedProfile = localStorage.getItem('aiLearning_userProfile');
    const savedRoadmap = localStorage.getItem('aiLearning_roadmap');
    const savedLearningData = localStorage.getItem('aiLearning_learningData');
    const savedGoalData = localStorage.getItem('aiLearning_goalData');

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    if (savedRoadmap) {
      setRoadmap(JSON.parse(savedRoadmap));
    }
    if (savedLearningData) {
      setLearningData(JSON.parse(savedLearningData));
    }

    // If no AI learning data exists, redirect to assessment to start the flow
    if (!savedProfile || !savedRoadmap || !savedGoalData) {
      navigate('/assessment');
      return;
    }

    // If we have profile and roadmap but no learning data, create it
    if (!savedLearningData && savedProfile && savedRoadmap) {
      const defaultLearningData = {
        goalData: JSON.parse(savedGoalData || '{}'),
        roadmap: JSON.parse(savedRoadmap),
        userProfile: JSON.parse(savedProfile),
        currentPhase: 1,
        dayNumber: 1,
        isGoalActive: true,
        goalStartDate: new Date().toISOString()
      };
      setLearningData(defaultLearningData);
      localStorage.setItem('aiLearning_learningData', JSON.stringify(defaultLearningData));
    }
  }, [navigate]);

  const handleTaskComplete = (progressEntry) => {
    console.log('Task completed:', progressEntry);
    // You can add additional logic here to sync with backend
  };

  const handleUpdateProgress = (progressUpdate) => {
    const updatedLearningData = {
      ...learningData,
      ...progressUpdate
    };
    setLearningData(updatedLearningData);
    localStorage.setItem('aiLearning_learningData', JSON.stringify(updatedLearningData));
  };

  if (!learningData || !userProfile || !roadmap) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Loading your AI learning dashboard...</div>
          <div className="text-gray-400">If this takes too long, you may need to complete the assessment first.</div>
          <button
            onClick={() => navigate('/assessment')}
            className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <LearningDashboardScreen
      learningData={learningData}
      userProfile={userProfile}
      roadmap={roadmap}
      onTaskComplete={handleTaskComplete}
      onUpdateProgress={handleUpdateProgress}
    />
  );
};

export default LearningDashboardPage; 