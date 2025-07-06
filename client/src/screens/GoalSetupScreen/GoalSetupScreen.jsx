import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { NavigationBarSection } from '../FrameScreen/sections/NavigationBarSection';
import { learningPaths, aiAssistant } from '../../services/aiLearningService';

export const GoalSetupScreen = ({ userProfile, onComplete }) => {
  const [selectedPath, setSelectedPath] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [motivation, setMotivation] = useState('');

  const handleSubmit = () => {
    if (!selectedPath || !timeframe) return;

    const goalData = {
      learningPath: selectedPath,
      timeframe: parseInt(timeframe),
      customGoal,
      motivation,
      userProfile
    };

    // Generate personalized roadmap
    const roadmap = aiAssistant.generatePersonalizedRoadmap(
      selectedPath,
      parseInt(timeframe),
      userProfile
    );

    onComplete(goalData, roadmap);
  };

  const pathOptions = Object.values(learningPaths);

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

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
              Set Your Learning Goal
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Choose your career path and timeline to get a personalized roadmap
            </p>
          </div>

          {/* User Profile Summary */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
            <CardContent className="p-6">
              <h3 className="text-white font-bold text-xl mb-4">Your Learning Profile</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-cyan-400 font-semibold text-sm">Learning Speed</div>
                  <div className="text-white text-lg font-bold">
                    {userProfile.learningSpeed >= 3.5 ? 'Fast' : 
                     userProfile.learningSpeed >= 2.5 ? 'Average' : 'Methodical'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-semibold text-sm">Focus Ability</div>
                  <div className="text-white text-lg font-bold">
                    {userProfile.focusCapability >= 3.5 ? 'Excellent' : 
                     userProfile.focusCapability >= 2.5 ? 'Good' : 'Developing'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-semibold text-sm">Time Commitment</div>
                  <div className="text-white text-lg font-bold">
                    {userProfile.timeCommitment >= 3.5 ? 'High' : 
                     userProfile.timeCommitment >= 2.5 ? 'Medium' : 'Limited'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-orange-400 font-semibold text-sm">Experience</div>
                  <div className="text-white text-lg font-bold">
                    {userProfile.experienceLevel >= 3.5 ? 'Advanced' : 
                     userProfile.experienceLevel >= 2.5 ? 'Intermediate' : 'Beginner'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Path Selection */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
            <CardContent className="p-8">
              <h3 className="text-white font-bold text-2xl mb-6">Choose Your Career Path</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pathOptions.map((path) => (
                  <button
                    key={path.id}
                    onClick={() => setSelectedPath(path.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                      selectedPath === path.id
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        path.difficulty === 'advanced' ? 'bg-red-500/20' :
                        path.difficulty === 'intermediate' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                      }`}>
                        {path.id === 'ai-ml' ? '🤖' :
                         path.id === 'fullstack-web' ? '💻' :
                         path.id === 'cloud-computing' ? '☁️' : '📊'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-2">{path.title}</h4>
                        <p className="text-gray-300 text-sm mb-3">{path.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            path.difficulty === 'advanced' ? 'bg-red-500/20 text-red-400' :
                            path.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {path.difficulty}
                          </span>
                          <span className="text-gray-400">
                            {path.duration.min}-{path.duration.max} months
                          </span>
                          <span className="text-gray-400">
                            {path.phases.length} phases
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeframe Selection */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
            <CardContent className="p-8">
              <h3 className="text-white font-bold text-2xl mb-6">Target Timeframe</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[2, 3, 4, 6].map((months) => (
                  <button
                    key={months}
                    onClick={() => setTimeframe(months.toString())}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-center ${
                      timeframe === months.toString()
                        ? 'border-cyan-400 bg-cyan-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-3xl mb-2">⏰</div>
                    <div className="text-white font-bold text-xl">{months} Months</div>
                    <div className="text-gray-400 text-sm mt-1">
                      {months === 2 ? 'Intensive' :
                       months === 3 ? 'Focused' :
                       months === 4 ? 'Balanced' : 'Comfortable'}
                    </div>
                  </button>
                ))}
              </div>

              {selectedPath && timeframe && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl border border-purple-400/30">
                  <div className="text-white font-semibold mb-2">Recommended Timeline Analysis:</div>
                  <div className="text-gray-300 text-sm">
                    {(() => {
                      const path = learningPaths[selectedPath];
                      const selectedMonths = parseInt(timeframe);
                      const recommendedMin = path.duration.min;
                      const recommendedMax = path.duration.max;
                      
                      if (selectedMonths < recommendedMin) {
                        return `⚠️ This is an aggressive timeline. You'll need ${Math.ceil(userProfile.timeCommitment * 1.5)} hours daily and high consistency.`;
                      } else if (selectedMonths > recommendedMax) {
                        return `✅ This gives you comfortable time to master concepts thoroughly with ${Math.ceil(userProfile.timeCommitment)} hours daily.`;
                      } else {
                        return `✅ This timeline aligns well with the course structure. Perfect for ${Math.ceil(userProfile.timeCommitment)} hours daily study.`;
                      }
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl mb-8">
            <CardContent className="p-8">
              <h3 className="text-white font-bold text-2xl mb-6">Additional Details</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Specific Goal or Focus Area (Optional)
                  </label>
                  <textarea
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none"
                    rows="3"
                    placeholder="e.g., I want to build mobile apps, focus on machine learning for healthcare, become a cloud architect..."
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    What motivates you to learn this? (Optional)
                  </label>
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none"
                    rows="3"
                    placeholder="e.g., Career change, promotion, personal interest, startup idea..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              onClick={handleSubmit}
              disabled={!selectedPath || !timeframe}
              className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl transition-all duration-300 font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate My Personalized Roadmap 🚀
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};