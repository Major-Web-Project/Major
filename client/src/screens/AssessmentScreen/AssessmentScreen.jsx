import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { assessmentQuestions, aiAssistant } from '../../services/aiLearningService';

export const AssessmentScreen = ({ onComplete }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const sections = Object.keys(assessmentQuestions);
  const currentSectionQuestions = assessmentQuestions[sections[currentSection]];
  const question = currentSectionQuestions[currentQuestion];

  const handleAnswerSelect = (value, weight, category) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    // Save response
    const response = {
      questionId: question.id,
      value: selectedAnswer,
      weight: question.options.find(opt => opt.value === selectedAnswer)?.weight || 1,
      category: question.category
    };
    
    setResponses([...responses, response]);
    setSelectedAnswer('');

    // Move to next question
    if (currentQuestion < currentSectionQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else {
      // Assessment complete
      completeAssessment([...responses, response]);
    }
  };

  const completeAssessment = (allResponses) => {
    const userProfile = aiAssistant.analyzeUserProfile(allResponses);
    onComplete(userProfile, allResponses);
  };

  const totalQuestions = Object.values(assessmentQuestions).reduce((sum, section) => sum + section.length, 0);
  const currentQuestionNumber = responses.length + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-primary">
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
              Learning Assessment
            </h1>
            <p className="text-gray-300 text-lg mb-6 dark:text-gray-300">
              Help us understand your learning style and create a personalized roadmap
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4 dark:bg-gray-700">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-indigo-700 text-sm dark:text-gray-400">
              Question {currentQuestionNumber} of {totalQuestions} • {sections[currentSection].replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>

          {/* Question Card */}
          <Card className="bg-mint-100/50 backdrop-blur-md border border-mint-200 rounded-3xl shadow-2xl dark:bg-accent/50 dark:border-border">
            <CardContent className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-indigo-700 mb-6 dark:text-white">
                  {question.question}
                </h2>
                
                <div className="space-y-4">
                  {question.options.map((option, index) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswerSelect(option.value, option.weight, question.category)}
                      className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                        selectedAnswer === option.value
                          ? 'border-cyan-400 bg-cyan-500/20 text-white'
                          : 'border-sky-200 bg-sky-50/50 text-indigo-700 hover:border-sky-300 hover:bg-sky-100/50 dark:border-white/20 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/40 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === option.value
                            ? 'border-cyan-400 bg-cyan-400'
                            : 'border-sky-300 dark:border-gray-400'
                        }`}>
                          {selectedAnswer === option.value && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className="text-lg font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sky-600 text-sm dark:text-gray-400">
                  Section: {sections[currentSection].replace(/([A-Z])/g, ' $1').trim()}
                </div>
                
                <Button
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentSection === sections.length - 1 && currentQuestion === currentSectionQuestions.length - 1
                    ? 'Complete Assessment'
                    : 'Next Question'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section Overview */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            {sections.map((section, index) => (
              <div
                key={section}
                className={`p-4 rounded-xl text-center transition-all duration-300 ${
                  index < currentSection
                    ? 'bg-green-500/20 border border-green-400/30'
                    : index === currentSection
                    ? 'bg-cyan-500/20 border border-cyan-400/30'
                    : 'bg-sky-100/50 border border-sky-200/50 dark:bg-gray-500/20 dark:border-gray-400/30'
                }`}
              >
                <div className={`text-2xl mb-2 ${
                  index < currentSection ? 'text-green-400' :
                  index === currentSection ? 'text-cyan-400' : 'text-sky-500 dark:text-gray-400'
                }`}>
                  {index < currentSection ? '✅' : index === currentSection ? '🔄' : '⏳'}
                </div>
                <div className={`text-sm font-semibold ${
                  index < currentSection ? 'text-green-400' :
                  index === currentSection ? 'text-cyan-400' : 'text-sky-600 dark:text-gray-400'
                }`}>
                  {section.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};