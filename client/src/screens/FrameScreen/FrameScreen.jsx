import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { AchieversSection } from './sections/AchieversSection';
import { ActionButtonsSection } from './sections/ActionButtonsSection';
import { ChatboxSection } from './sections/ChatboxSection';
import { ConclusionSection } from './sections/ConclusionSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { GoalSelectionSection } from './sections/GoalSelectionSection';
import { InteractiveGroupSection } from './sections/InteractiveGroupSection';
import { MainContentSection } from './sections/MainContentSection';

export const FrameScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  // Ensure page starts at top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const decorativeImages = [
    {
      src: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'AI Learning Assistant',
      className:
        'w-[160px] h-[140px] sm:w-[200px] sm:h-[170px] lg:w-[240px] lg:h-[200px] top-4 left-4 sm:left-8 lg:left-16 rounded-3xl object-cover shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 cursor-pointer',
    },
    {
      src: 'https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Interactive Learning',
      className:
        'w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[280px] lg:h-[280px] top-8 sm:top-12 lg:top-16 right-4 sm:right-8 lg:right-16 rounded-3xl object-cover shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:scale-105 cursor-pointer',
    },
    {
      src: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Goal Achievement',
      className:
        'w-[200px] h-[120px] sm:w-[260px] sm:h-[160px] lg:w-[320px] lg:h-[200px] bottom-4 left-0 sm:left-4 lg:left-8 rounded-3xl object-cover shadow-2xl hover:shadow-pink-500/25 transition-all duration-500 hover:scale-105 cursor-pointer',
    },
  ];

  const openImageModal = (src) => {
    setSelectedImage(src);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

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
          <source
            src="https://videos.pexels.com/video-files/3195394/3195394-uhd_3840_2160_25fps.mp4"
            type="video/mp4"
          />
          {/* Fallback for browsers that don't support video */}
        </video>

        {/* Video overlay for better text readability */}
        <div className="absolute inset-0 bg-[#e9f1e4]/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-purple-900/60 dark:to-slate-900/80"></div>

        {/* Animated particles overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-500"></div>

          {/* Floating particles */}
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60 animate-bounce animation-delay-200"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-purple-300 rounded-full opacity-80 animate-bounce animation-delay-700"></div>
          <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-70 animate-bounce animation-delay-1200"></div>
        </div>
      </div>

      {/* Grid overlay background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-20 w-full">
        <div className="relative w-full overflow-x-hidden">
          {/* Hero Section with Interactive Group */}
          <div className="relative w-full pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
            <Card className="relative mx-auto w-full max-w-7xl rounded-3xl sm:rounded-[60px] border-none shadow-2xl backdrop-blur-md bg-mint-100 border-mint-200 overflow-hidden dark:bg-white/10 dark:border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-mint-50 to-transparent dark:from-white/5 dark:to-transparent"></div>

              <div className="flex flex-col lg:flex-row relative z-10">
                <div className="flex-1 p-6 sm:p-8 lg:p-12">
                  <InteractiveGroupSection />
                </div>

                <div className="relative w-full lg:w-[600px] xl:w-[700px] h-[400px] sm:h-[500px] lg:h-[700px] p-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-lavender-100 rounded-r-3xl sm:rounded-r-[60px] dark:from-blue-500/10 dark:to-purple-500/10" />

                  {decorativeImages.map((image, index) => (
                    <img
                      key={index}
                      className={`absolute transition-all duration-500 ${image.className}`}
                      alt={image.alt}
                      src={image.src}
                      loading="lazy"
                      onClick={() => openImageModal(image.src)}
                      onError={(e) => {
                        console.warn(`Failed to load image: ${image.src}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Section */}
          <MainContentSection />

          {/* Chat Section */}
          <ChatboxSection />

          {/* Goal Selection */}
          <GoalSelectionSection />

          {/* Achievers Section */}
          <AchieversSection />

          {/* Feedback Section with Action Buttons */}
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <FeedbackSection onImageClick={openImageModal} />
            <ActionButtonsSection />
          </div>

          {/* Footer */}
          <ConclusionSection />
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-300 hover:scale-110"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
