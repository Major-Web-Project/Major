import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';

export const InteractiveGroupSection = () => {
  const steps = [
    {
      title: 'Set Your Goal',
      description: 'Define what you want to achieve',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Assess Your Skills',
      description: 'Identify strengths and areas to improve',
      icon: '📊',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Create Timeline',
      description: 'Set realistic deadlines and milestones',
      icon: '⏰',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Complete Tasks',
      description: 'Follow your personalized learning path',
      icon: '✅',
      color: 'from-orange-500 to-red-500',
    },
  ];

  const handleStartNow = () => {
    const goalSection = document.querySelector(
      '[data-section="goal-selection"]'
    );
    if (goalSection) {
      goalSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full max-w-2xl mx-auto py-6 sm:py-12 animate-fadeInUp">
      <div className="flex flex-col space-y-6 sm:space-y-8">
        {/* Main Headings */}
        <div className="space-y-3 sm:space-y-4 text-center lg:text-left">
          <h1 className="font-bold text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-none font-poppins animate-slideInLeft">
            NEXT LEVEL
          </h1>
          <h2 className="font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent text-2xl sm:text-3xl lg:text-4xl xl:text-5xl tracking-tight leading-none font-poppins animate-slideInRight">
            LEARNING EXPERIENCE
          </h2>
          <p className="text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 text-sky-700 dark:text-gray-300 animate-fadeIn animation-delay-500">
            Transform your career with AI-powered personalized learning paths
            and expert guidance
          </p>
        </div>

        {/* Steps Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="font-bold text-cyan-400 text-2xl sm:text-3xl lg:text-4xl tracking-tight font-poppins text-center lg:text-left animate-slideInLeft animation-delay-300">
            YOUR JOURNEY
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="group hover:scale-105 transition-all duration-500 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden animate-slideInUp cursor-pointer"
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-lg sm:text-xl mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-sm sm:text-base leading-relaxed text-sky-700 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 sm:pt-6 text-center lg:text-left">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-lg opacity-60 animate-pulse"></div>
            <Button
              onClick={handleStartNow}
              className="relative px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 rounded-full font-bold text-white text-xl sm:text-2xl lg:text-3xl shadow-2xl border-0 transition-all duration-500 hover:scale-110 hover:shadow-cyan-500/25 font-poppins animate-bounceIn animation-delay-800"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
