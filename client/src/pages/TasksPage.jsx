import React, { useState, useEffect } from 'react';
import { TasksScreen } from '../components/tasks/TasksScreen';

export default function TasksPage() {
  // Mock data for now - replace with actual data from your app state/context
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com'
  });

  const [learningData, setLearningData] = useState({
    currentPhase: 1,
    dayNumber: 15,
    totalDays: 30
  });

  const [goalData, setGoalData] = useState({
    learningPath: 'Full Stack Development',
    targetSkills: ['React', 'Node.js', 'MongoDB']
  });

  const handleTaskComplete = (taskId) => {
    console.log('Task completed:', taskId);
    // Handle task completion logic here
  };

  return (
    <TasksScreen
      userProfile={userProfile}
      learningData={learningData}
      aiTasksData={[]}
      roadmap={[]}
      goalData={goalData}
      onTaskComplete={handleTaskComplete}
    />
  );
}