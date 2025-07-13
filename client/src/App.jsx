import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NavigationBarSection } from "./screens/FrameScreen/sections/NavigationBarSection/NavigationBarSection";
import { ThemeProvider } from "./lib/ThemeContext";

// Import your screen components
import { AuthScreen } from "./screens/AuthScreen/AuthScreen";
import { DashboardScreen } from "./screens/DashboardScreen/DashboardScreen";
import { AboutScreen } from "./screens/AboutScreen/AboutScreen";
import { AssessmentScreen } from "./screens/AssessmentScreen/AssessmentScreen";
import { FrameScreen } from "./screens/FrameScreen/FrameScreen";
import GoalSetupScreen from "./screens/GoalSetupScreen/GoalSetupScreen";
import { LearningDashboardScreen } from "./screens/LearningDashboardScreen/LearningDashboardScreen";
import { RoadmapScreen } from "./screens/RoadmapScreen/RoadmapScreen";
import { TasksScreen } from "./screens/TasksScreen/TasksScreen";

function App() {
  const [goalSet, setGoalSet] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [goalData, setGoalData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [learningData, setLearningData] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Sync user state with localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Handle login success
  const handleLogin = (userData, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleAssessmentComplete = (userProfile, allResponses) => {
    setUserProfile(userProfile);
    navigate("/goal-setup");
  };

  const handleGoalSetupComplete = (goalData, roadmap) => {
    setGoalSet(true);
    setGoalData(goalData);
    setRoadmap(roadmap);
    navigate("/roadmap");
  };

  const handleStartLearning = (learningData) => {
    setLearningData(learningData);
    navigate("/learning-dashboard");
  };

  return (
    <ThemeProvider>
      <div className="bg-background text-primary min-h-screen transition-colors duration-500">
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <NavigationBarSection 
          user={user} 
          isAuthenticated={isAuthenticated} 
          handleLogout={handleLogout}
          handleLogin={handleLogin}
        />
        <Routes>
          <Route path="/" element={<FrameScreen />} />
          <Route path="/auth" element={<AuthScreen onLogin={handleLogin} />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/assessment" element={<AssessmentScreen onComplete={handleAssessmentComplete} />} />
          <Route path="/goal-setup" element={<GoalSetupScreen userProfile={userProfile} onComplete={handleGoalSetupComplete} />} />
          <Route path="/roadmap" element={<RoadmapScreen goalData={goalData} roadmap={roadmap} userProfile={userProfile} onStartLearning={handleStartLearning} />} />
          <Route
            path="/learning-dashboard"
            element={
              goalSet && learningData && roadmap && userProfile ? (
                <LearningDashboardScreen
                  learningData={learningData}
                  userProfile={userProfile}
                  roadmap={roadmap}
                  goalData={goalData}
                />
              ) : (
                <Navigate to="/assessment" replace />
              )
            }
          />
          <Route path="/tasks" element={<TasksScreen />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
