import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { aiAssistant } from '../../services/aiLearningService';

export const RoadmapScreen = ({ goalData, roadmap, userProfile, onStartLearning }) => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [dayNumber, setDayNumber] = useState(1);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Generate initial daily tasks
    const tasks = aiAssistant.generateDailyTasks(roadmap, currentPhase, dayNumber, userProfile);
    setDailyTasks(tasks);
  }, [currentPhase, dayNumber, roadmap, userProfile]);

  const handleStartLearning = () => {
    const learningData = {
      goalData,
      roadmap,
      userProfile,
      currentPhase,
      dayNumber,
      dailyTasks
    };
    
    // Scroll to top before redirecting
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Small delay to allow scroll animation to start
    setTimeout(() => {
      onStartLearning(learningData);
    }, 100);
  };

  const totalWeeks = roadmap.phases.reduce((sum, phase) => sum + phase.duration, 0);
  const successProbability = Math.round(roadmap.successPrediction * 100);

  return (
    <div className="min-h-screen relative overflow-hidden bg-mint-100 text-indigo-700 dark:bg-background dark:text-primary">
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
        <div className="absolute inset-0 bg-[#e9f1e4]/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-purple-900/60 dark:to-slate-900/80"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-500"></div>
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60 animate-bounce animation-delay-200"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-300 rounded-full opacity-80 animate-bounce animation-delay-700"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-70 animate-bounce animation-delay-1200"></div>
        </div>
      </div>

      <div className="relative z-20 w-full">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
              Your Personalized Roadmap
            </h1>
            <p className="text-lg mb-6 text-sky-700 dark:text-gray-300">
              AI-generated learning path tailored to your profile and goals
            </p>
          </div>

          {/* Success Prediction */}
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-400/30 rounded-3xl shadow-2xl mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-indigo-700 font-bold text-2xl mb-2 dark:text-white">Success Prediction</h3>
                  <p className="text-sky-700 dark:text-gray-300">
                    Based on your profile and chosen timeline, our AI predicts your success probability
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold mb-2 ${
                    successProbability >= 80 ? 'text-blue-500 dark:text-green-400' :
                    successProbability >= 60 ? 'text-cyan-500 dark:text-yellow-400' : 'text-red-400'
                  }`}>
                    {successProbability}%
                  </div>
                  <div className="text-sky-700 text-sm dark:text-gray-300">Success Rate</div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-sky-100/50 p-4 rounded-xl dark:bg-white/10">
                  <div className="text-cyan-400 font-semibold text-sm">Total Duration</div>
                  <div className="text-indigo-700 text-xl font-bold dark:text-white">{totalWeeks} weeks</div>
                </div>
                <div className="bg-sky-100/50 p-4 rounded-xl dark:bg-white/10">
                  <div className="text-indigo-400 font-semibold text-sm">Daily Commitment</div>
                  <div className="text-indigo-700 text-xl font-bold dark:text-white">{roadmap.personalizedSchedule.dailyHours}h/day</div>
                </div>
                <div className="bg-sky-100/50 p-4 rounded-xl dark:bg-white/10">
                  <div className="text-blue-400 font-semibold text-sm">Study Sessions</div>
                  <div className="text-indigo-700 text-xl font-bold dark:text-white">{roadmap.personalizedSchedule.sessionsPerDay}/day</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Phases */}
          <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-8 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8">
              <h3 className="text-indigo-700 font-bold text-2xl mb-6 dark:text-white">Learning Phases</h3>
              
              <div className="space-y-6">
                {roadmap.phases.map((phase, index) => (
                  <div
                    key={phase.phase}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      currentPhase === phase.phase
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-sky-200 bg-sky-50/50 dark:border-white/20 dark:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                          currentPhase === phase.phase
                            ? 'bg-cyan-500 text-white'
                            : currentPhase > phase.phase
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {currentPhase > phase.phase ? '✓' : phase.phase}
                        </div>
                        <div>
                          <h4 className="text-indigo-700 font-bold text-xl dark:text-white">{phase.title}</h4>
                          <p className="text-sky-700 dark:text-gray-300">Phase {phase.phase} • {phase.duration} weeks</p>
                        </div>
                      </div>
                      
                      {phase.adjustedForUser && (
                        <div className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                          <span className="text-purple-400 text-sm font-semibold">AI Adjusted</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">Topics Covered</h5>
                        <div className="flex flex-wrap gap-2">
                          {phase.topics.map((topic, topicIndex) => (
                            <span
                              key={topicIndex}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-400/30"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-indigo-700 font-semibold mb-3 dark:text-white">Key Projects</h5>
                        <ul className="space-y-2">
                          {phase.projects.map((project, projectIndex) => (
                            <li key={projectIndex} className="text-sky-700 flex items-center gap-2 dark:text-gray-300">
                              <span className="text-green-400">•</span>
                              {project}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Tasks Preview */}
          <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-8 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8">
              <h3 className="text-indigo-700 font-bold text-2xl mb-6 dark:text-white">Today's Tasks Preview</h3>
              
              <div className="space-y-4">
                {dailyTasks.map((task, index) => (
                  <div key={task.id} className="p-4 bg-sky-100/30 rounded-xl border border-sky-200/50 dark:bg-white/5 dark:border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-indigo-700 font-semibold text-lg mb-2 dark:text-white">{task.title}</h4>
                        <p className="text-sky-700 text-sm mb-3 dark:text-gray-300">{task.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {task.priority} priority
                          </span>
                          <span className="text-sky-600 dark:text-gray-400">
                            ⏱️ {task.estimatedTime}h estimated
                          </span>
                          <span className="text-sky-600 dark:text-gray-400">
                            📂 {task.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl ${
                          task.type === 'learning' ? 'text-blue-400' :
                          task.type === 'practice' ? 'text-green-400' : 'text-purple-400'
                        }`}>
                          {task.type === 'learning' ? '📚' :
                           task.type === 'practice' ? '💻' : '🔄'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personalized Schedule */}
          <Card className="bg-sky-50/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-8 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8">
              <h3 className="text-indigo-700 font-bold text-2xl mb-6 dark:text-white">Your Personalized Schedule</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-6 rounded-xl border border-blue-400/30">
                  <div className="text-blue-400 font-semibold text-sm mb-2">Daily Study Time</div>
                  <div className="text-indigo-700 text-2xl font-bold mb-1 dark:text-white">{roadmap.personalizedSchedule.dailyHours} hours</div>
                  <div className="text-blue-300 text-xs">Optimized for your profile</div>
                </div>
                <div className="bg-gradient-to-r from-indigo-400/20 to-purple-400/20 p-6 rounded-xl border border-indigo-400/30">
                  <div className="text-purple-400 font-semibold text-sm mb-2">Study Sessions</div>
                  <div className="text-white text-2xl font-bold mb-1">{roadmap.personalizedSchedule.sessionsPerDay} per day</div>
                  <div className="text-purple-500 text-xs">Based on your focus ability</div>
                </div>
                <div className="bg-gradient-to-r from-blue-400/20 to-cyan-400/20 p-6 rounded-xl border border-blue-400/30">
                  <div className="text-blue-400 font-semibold text-sm mb-2">Break Intervals</div>
                  <div className="text-white text-2xl font-bold mb-1">{roadmap.personalizedSchedule.breakIntervals} min</div>
                  <div className="text-blue-400 text-xs">Optimal focus periods</div>
                </div>
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 rounded-xl border border-orange-400/30">
                  <div className="text-orange-400 font-semibold text-sm mb-2">Study Days</div>
                  <div className="text-white text-2xl font-bold mb-1">{roadmap.personalizedSchedule.weeklyStructure.studyDays}/week</div>
                  <div className="text-orange-500 text-xs dark:text-orange-300">
                    Sustainable pace
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Learning Button */}
          <div className="text-center">
            <Button
              onClick={handleStartLearning}
              className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-cyan-500/25"
            >
              Start My Learning Journey 🚀
            </Button>
            
            <p className="text-gray-400 text-sm mt-4">
              Your AI assistant will track your progress and adjust the plan as needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};