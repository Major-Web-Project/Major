import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { NavigationBarSection } from '../FrameScreen/sections/NavigationBarSection';
import { CalendarSection } from './components/CalendarSection';
import { DailyTaskChargeSection } from './components/DailyTaskChargeSection';
import { TaskReportSection } from './components/TaskReportSection';
import { aiAssistant } from '../../services/aiLearningService';

export const TasksScreen = ({ userProfile, learningData, aiTasksData, roadmap, goalData, onTaskComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchUserTasks = async () => {
      setLoading(true);
      try {
        // Initialize AI assistant if user profile exists
        if (userProfile) {
          aiAssistant.userProfile = userProfile;
        }

        let allTasks = [];

        // If we have AI learning data, use AI-generated tasks
        if (learningData && userProfile && roadmap) {
          // Get existing AI tasks
          if (aiTasksData && aiTasksData.length > 0) {
            allTasks = aiTasksData.map(aiTask => ({
              id: aiTask.id,
              title: aiTask.title,
              description: aiTask.description,
              assignedDate: new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              priority: aiTask.priority,
              status: aiTask.status || 'pending',
              estimatedTime: aiTask.estimatedTime,
              category: aiTask.category,
              assignedBy: 'AI Learning Assistant',
              tags: aiTask.topics || ['AI-Generated'],
              courseId: 'AI-LEARNING-001',
              courseName: `AI ${goalData?.learningPath || 'Personalized Learning'}`,
              difficultyLevel: aiTask.difficulty === 5 ? 'advanced' : 
                              aiTask.difficulty >= 3 ? 'intermediate' : 'beginner',
              skillsGained: aiTask.topics || ['Problem Solving'],
              taskType: aiTask.type,
              learningObjectives: [`Master ${aiTask.title}`, 'Apply learned concepts'],
              prerequisites: ['Basic understanding of the topic'],
              resources: aiTask.resources || [
                { type: 'video', title: 'Tutorial Video', url: '#' },
                { type: 'article', title: 'Reference Article', url: '#' }
              ],
              gradeWeight: 15,
              maxAttempts: 2,
              currentAttempt: 0,
              isAIGenerated: true
            }));
          }

          // Generate additional AI tasks for different days
          for (let i = 0; i < 7; i++) {
            const dayTasks = aiAssistant.generateDailyTasks(
              roadmap,
              learningData.currentPhase || 1,
              (learningData.dayNumber || 1) + i,
              userProfile
            );

            const assignedDate = new Date();
            assignedDate.setDate(assignedDate.getDate() - i);
            
            const dueDate = new Date(assignedDate);
            dueDate.setDate(assignedDate.getDate() + 3);

            dayTasks.forEach(aiTask => {
              allTasks.push({
                id: `${aiTask.id}-day-${i}`,
                title: aiTask.title,
                description: aiTask.description,
                assignedDate: assignedDate.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                priority: aiTask.priority,
                status: i === 0 ? (aiTask.status || 'pending') : 'pending',
                estimatedTime: aiTask.estimatedTime,
                category: aiTask.category,
                assignedBy: 'AI Learning Assistant',
                tags: aiTask.topics || ['AI-Generated'],
                courseId: 'AI-LEARNING-001',
                courseName: `AI ${goalData?.learningPath || 'Personalized Learning'}`,
                difficultyLevel: aiTask.difficulty === 5 ? 'advanced' : 
                                aiTask.difficulty >= 3 ? 'intermediate' : 'beginner',
                skillsGained: aiTask.topics || ['Problem Solving'],
                taskType: aiTask.type,
                learningObjectives: [`Master ${aiTask.title}`, 'Apply learned concepts'],
                prerequisites: ['Basic understanding of the topic'],
                resources: aiTask.resources || [
                  { type: 'video', title: 'Tutorial Video', url: '#' },
                  { type: 'article', title: 'Reference Article', url: '#' }
                ],
                gradeWeight: 15,
                maxAttempts: 2,
                currentAttempt: 0,
                isAIGenerated: true
              });
            });
          }
        } else {
          // Fallback: Generate some sample tasks if no AI data
          allTasks = generateSampleTasks();
        }

        setTimeout(() => {
          setTasks(allTasks);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        setLoading(false);
      }
    };

    fetchUserTasks();
  }, [userProfile, learningData, aiTasksData, roadmap, goalData]);

  // Generate sample tasks for fallback
  const generateSampleTasks = () => {
    const sampleTasks = [];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const assignedDate = new Date(today);
      assignedDate.setDate(today.getDate() - i);
      
      const dueDate = new Date(assignedDate);
      dueDate.setDate(assignedDate.getDate() + 3);

      sampleTasks.push({
        id: `sample-task-${i}`,
        title: `Sample Learning Task ${i + 1}`,
        description: 'This is a sample task for demonstration purposes.',
        assignedDate: assignedDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        priority: ['high', 'medium', 'low'][i % 3],
        status: ['pending', 'in-progress', 'completed'][i % 3],
        estimatedTime: Math.floor(Math.random() * 4) + 1,
        category: 'General Learning',
        assignedBy: 'Learning Platform',
        tags: ['Sample', 'Learning'],
        courseId: 'SAMPLE-001',
        courseName: 'Sample Course',
        difficultyLevel: 'intermediate',
        skillsGained: ['Problem Solving'],
        taskType: 'assignment',
        learningObjectives: ['Complete sample task'],
        prerequisites: ['Basic knowledge'],
        resources: [
          { type: 'video', title: 'Sample Video', url: '#' }
        ],
        gradeWeight: 10,
        maxAttempts: 2,
        currentAttempt: 0,
        isAIGenerated: false
      });
    }
    
    return sampleTasks;
  };

  // Filter tasks by selected date
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(
      (task) =>
        task.assignedDate === dateStr ||
        task.dueDate === dateStr ||
        (task.assignedDate <= dateStr && task.dueDate >= dateStr)
    );
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

  // Get current course name for display
  const getCurrentCourseName = () => {
    if (learningData && goalData) {
      return `AI ${goalData.learningPath || 'Personalized Learning'}`;
    }
    return 'Current Course';
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 w-full h-full z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.3) contrast(1.2)' }}
          >
            <source
              src="https://videos.pexels.com/video-files/3129671/3129671-uhd_3840_2160_30fps.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>
        </div>

        <div className="relative z-20">
          <NavigationBarSection />
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-white text-2xl font-semibold">
                Loading your AI tasks...
              </p>
              <p className="text-gray-400 text-lg mt-2">
                Generating personalized assignments and deadlines
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.3) contrast(1.2)' }}
        >
          <source
            src="https://videos.pexels.com/video-files/3129671/3129671-uhd_3840_2160_30fps.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80"></div>
      </div>

      <div className="relative z-20 w-full">
        <NavigationBarSection />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Enhanced Header with AI Integration */}
          <div className="mb-10">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 font-poppins">
              AI Task Management
            </h1>
            <p className="text-gray-300 text-xl mb-6">
              Track your AI-generated learning tasks and monitor your progress
            </p>

            {/* Current Course Display */}
            <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-2xl p-6 mb-6 border border-purple-400/30">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🎓</span>
                <div>
                  <div className="text-white font-bold text-xl">
                    Current Course: {getCurrentCourseName()}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {learningData ? (
                      <>
                        Phase {learningData.currentPhase} • Day {learningData.dayNumber} • 
                        AI-Powered Learning Path
                      </>
                    ) : (
                      'Your personalized learning journey'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-cyan-400 font-semibold text-sm">
                  Total Tasks
                </div>
                <div className="text-white text-2xl font-bold">
                  {tasks.length}
                </div>
                <div className="text-gray-400 text-xs">
                  {tasks.filter(t => t.isAIGenerated).length} AI-generated
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-green-400 font-semibold text-sm">
                  Completed
                </div>
                <div className="text-white text-2xl font-bold">
                  {tasks.filter((t) => t.status === 'completed').length}
                </div>
                <div className="text-gray-400 text-xs">
                  {Math.round(
                    (tasks.filter((t) => t.status === 'completed').length /
                      Math.max(tasks.length, 1)) * 100
                  )}% completion rate
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-purple-400 font-semibold text-sm">
                  In Progress
                </div>
                <div className="text-white text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-gray-400 text-xs">Active tasks</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-orange-400 font-semibold text-sm">
                  Current Phase
                </div>
                <div className="text-white text-2xl font-bold">
                  {learningData?.currentPhase || 1}
                </div>
                <div className="text-gray-400 text-xs">Learning phase</div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="mb-10">
            <CalendarSection
              tasks={tasks}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Daily Task Charge Section */}
          <div className="mb-10">
            <DailyTaskChargeSection
              tasks={selectedDateTasks}
              selectedDate={selectedDate}
              onTaskComplete={onTaskComplete}
            />
          </div>

          {/* Task Report Section */}
          <div className="mb-10">
            <TaskReportSection tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
};