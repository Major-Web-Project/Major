import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import your screen components
import { AuthScreen } from "./screens/AuthScreen/AuthScreen";
import { DashboardScreen } from "./screens/DashboardScreen/DashboardScreen";
import { AboutScreen } from "./screens/AboutScreen/AboutScreen";
import { AssessmentScreen } from "./screens/AssessmentScreen/AssessmentScreen";
import { FrameScreen } from "./screens/FrameScreen/FrameScreen";
import { GoalSetupScreen } from "./screens/GoalSetupScreen/GoalSetupScreen";
import { LearningDashboardScreen } from "./screens/LearningDashboardScreen/LearningDashboardScreen";
import { RoadmapScreen } from "./screens/RoadmapScreen/RoadmapScreen";
import { TasksScreen } from "./screens/TasksScreen/TasksScreen";

function App() {
  // You can add authentication logic here later
  const isAuthenticated = true; // Placeholder for authentication status

  return (
    <>
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
      <Routes>
        <Route path="/" element={<FrameScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/assessment" element={<AssessmentScreen />} />
        <Route path="/goal-setup" element={<GoalSetupScreen />} />
        <Route
          path="/learning-dashboard"
          element={<LearningDashboardScreen />}
        />
        <Route path="/roadmap" element={<RoadmapScreen />} />
        <Route path="/tasks" element={<TasksScreen />} />
      </Routes>
    </>
  );
}

export default App;
