import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../../components/ui/select';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';

export const GoalSelectionSection = () => {
  const [selectedField, setSelectedField] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const fieldOptions = [
    {
      value: 'ai-ml',
      label: 'AI/ML Engineer',
      icon: '🤖',
      description: 'Master artificial intelligence and machine learning',
    },
    {
      value: 'fullstack-web',
      label: 'Full Stack Web Developer',
      icon: '💻',
      description: 'Build complete web applications',
    },
    {
      value: 'cloud-computing',
      label: 'Cloud Computing Specialist',
      icon: '☁️',
      description: 'Master cloud platforms and infrastructure',
    },
    {
      value: 'dsa-challenge',
      label: 'DSA Challenge Master',
      icon: '📊',
      description: 'Excel in coding interviews and competitive programming',
    },
  ];

  const handleFieldSelect = (value) => {
    setSelectedField(value);
  };

  const handleStartLearning = () => {
    if (selectedField) {
      // Navigate to assessment screen
      navigate('/assessment');
    }
  };

  const selectedFieldData = fieldOptions.find(
    (field) => field.value === selectedField
  );

  return (
    <section
      data-section="goal-selection"
      className="w-full max-w-6xl py-12 sm:py-16 mx-auto flex flex-col items-center gap-8 sm:gap-12 px-4 sm:px-8 bg-background"
    >
      <div className="text-center space-y-4">
        <h2 className="font-bold text-primary text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight font-poppins animate-fadeInUp">
          Choose Your Learning Path
        </h2>
        <p className="text-secondary text-lg sm:text-xl max-w-2xl mx-auto animate-fadeInUp animation-delay-200">
          Select your career goal and get a personalized AI-powered learning roadmap
        </p>
      </div>

      <Card className="w-full max-w-2xl bg-accent/50 backdrop-blur-md border border-border rounded-3xl shadow-2xl animate-slideInUp animation-delay-400">
        <CardContent className="p-8 sm:p-12">
          <div className="space-y-6 sm:space-y-8">
            {/* Field Selection */}
            <div className="space-y-4">
              <label className="block text-primary text-xl sm:text-2xl font-semibold text-center">
                Select Your Career Goal
              </label>

              <Select onValueChange={handleFieldSelect}>
                <SelectTrigger className="w-full h-14 sm:h-16 bg-accent/10 backdrop-blur-sm rounded-2xl border-2 border-border hover:border-cyan-400/50 transition-all duration-300 text-lg sm:text-xl font-medium text-primary">
                  <SelectValue placeholder="Choose your career path..." />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-md border-border rounded-xl shadow-2xl dark:bg-gray-900/95">
                  {fieldOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="text-primary hover:bg-accent/10 cursor-pointer p-4 rounded-lg m-1 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <div className="font-semibold text-lg">
                            {option.label}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Field Preview */}
            {selectedFieldData && (
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl p-6 border border-border animate-fadeIn">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{selectedFieldData.icon}</span>
                  <div>
                    <h3 className="text-primary text-xl font-bold">
                      {selectedFieldData.label}
                    </h3>
                    <p className="text-secondary">
                      {selectedFieldData.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-accent/10 rounded-lg p-3">
                    <div className="text-cyan-400 font-bold text-lg">
                      AI-Powered
                    </div>
                    <div className="text-primary">Personalized Plan</div>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-3">
                    <div className="text-purple-400 font-bold text-lg">
                      Progress Tracking
                    </div>
                    <div className="text-primary">Real-time Analytics</div>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-3">
                    <div className="text-pink-400 font-bold text-lg">
                      Goal Prediction
                    </div>
                    <div className="text-primary">Success Probability</div>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-lg opacity-60 animate-pulse"></div>
                <Button
                  onClick={handleStartLearning}
                  disabled={!selectedField}
                  className="relative px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-full font-bold text-primary text-xl sm:text-2xl shadow-2xl border-0 transition-all duration-500 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
                >
                  Start AI Assessment 🚀
                </Button>
              </div>
              
              {selectedField && (
                <p className="text-gray-400 text-sm mt-4 animate-fadeIn">
                  Take a quick assessment to get your personalized roadmap
                </p>
              )}
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6 text-center animate-bounceIn">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-green-400 font-bold text-xl mb-2">
                  Great Choice!
                </div>
                <div className="text-primary">
                  Starting your AI-powered learning journey for {selectedFieldData?.label}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};