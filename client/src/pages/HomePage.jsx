import React from 'react';
import { motion } from 'framer-motion';
import RevealHero from '../components/home/RevealHero';
import FeaturesSection from '../components/home/FeaturesSection';
import AchieversSection from '../components/home/AchieversSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

const HomePage = () => {
  return (
    <div className="bg-[#111111]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <RevealHero />
      </motion.div>
      <FeaturesSection />
      <AchieversSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default HomePage; 