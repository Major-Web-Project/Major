import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { NavigationBarSection } from '../FrameScreen/sections/NavigationBarSection';
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

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 font-poppins">
              Learning Assessment
            </h1>
            <p className="text-gray-300 text-lg mb-6">
              Help us understand your learning style and create a personalized roadmap
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm">
              Question {currentQuestionNumber} of {totalQuestions} • {sections[currentSection].replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>

          {/* Question Card */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
            <CardContent className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">
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
                          : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === option.value
                            ? 'border-cyan-400 bg-cyan-400'
                            : 'border-gray-400'
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
                <div className="text-gray-400 text-sm">
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
                    : 'bg-gray-500/20 border border-gray-400/30'
                }`}
              >
                <div className={`text-2xl mb-2 ${
                  index < currentSection ? 'text-green-400' :
                  index === currentSection ? 'text-cyan-400' : 'text-gray-400'
                }`}>
                  {index < currentSection ? '✅' : index === currentSection ? '🔄' : '⏳'}
                </div>
                <div className={`text-sm font-semibold ${
                  index < currentSection ? 'text-green-400' :
                  index === currentSection ? 'text-cyan-400' : 'text-gray-400'
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