import React from 'react';
import { Button } from '../../../../components/ui/button';

export const MainContentSection = () => {
  const scrollToGoalSelection = () => {
    const goalSection = document.querySelector(
      '[data-section="goal-selection"]'
    );
    if (goalSection) {
      goalSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-12 sm:py-16 flex flex-col items-center justify-center px-4 sm:px-8">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 max-w-6xl mx-auto text-center lg:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-normal leading-tight text-white animate-slideInLeft">
          Ready to start your journey?
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Set your first goal
          </span>
        </h2>

        <div className="relative animate-bounceIn animation-delay-500">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
          <Button
            onClick={scrollToGoalSelection}
            className="relative px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 rounded-full transition-all duration-500 hover:scale-110 shadow-2xl border-0 group"
          >
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
              New Goal
            </span>
            <span className="ml-3 text-2xl sm:text-3xl group-hover:translate-x-1 transition-transform duration-300">
              🎯
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
