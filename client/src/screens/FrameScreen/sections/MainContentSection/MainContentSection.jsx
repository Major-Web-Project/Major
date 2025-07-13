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
    <section className="w-full py-12 sm:py-16 flex flex-col items-center justify-center px-4 sm:px-8 bg-mint-100 dark:bg-background">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 max-w-6xl mx-auto text-center lg:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-normal leading-tight text-indigo-700 animate-slideInLeft dark:text-primary">
          Ready to start your journey?
        </h2>
        <div className="flex items-center">
          <Button
            onClick={scrollToGoalSelection}
            className="relative px-8 sm:px-12 py-4 sm:py-6 border-2 border-mint-200 text-indigo-700 group flex items-center rounded-full transition-all duration-500 hover:scale-110 shadow-2xl bg-transparent hover:bg-gradient-to-r hover:from-mint-300 hover:to-sky-300 hover:text-white dark:border-white dark:text-white dark:hover:text-blue-400 dark:hover:border-blue-400 dark:hover:bg-white/10"
          >
            <span className="text-2xl sm:text-3xl lg:text-5xl group-hover:scale-110 transition-transform duration-300">
              New Goal
            </span>
            <span className="ml-3 text-2xl sm:text-3xl lg:text-5xl group-hover:translate-x-1 transition-transform duration-300">
              🎯
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
