import React, { useState } from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { testimonials } from "../../../../data/mockData";

export const FeedbackSection = ({ onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="relative w-full py-12 sm:py-16">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 font-poppins">
          Success Stories
        </h2>
        <p className="text-gray-300 text-lg sm:text-xl">
          Hear from our amazing learners who achieved their goals
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto relative px-4 sm:px-8">
        {/* Main testimonial card */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute w-full h-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>

          <Card className="border-none rounded-3xl shadow-2xl relative bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
            <CardContent className="p-8 sm:p-12 lg:p-16">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div 
                    className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-2xl cursor-pointer hover:scale-110 transition-transform duration-500 border-4 border-gradient-to-r from-cyan-400 to-purple-400"
                    onClick={() => onImageClick && onImageClick(currentTestimonial.image)}
                  >
                    <img
                      src={currentTestimonial.image}
                      alt={currentTestimonial.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center lg:text-left">
                  {/* Rating Stars */}
                  <div className="flex justify-center lg:justify-start mb-4">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-2xl sm:text-3xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                        ⭐
                      </span>
                    ))}
                  </div>

                  {/* Course Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full text-cyan-400 font-semibold text-sm sm:text-base border border-cyan-400/30">
                      📚 {currentTestimonial.course}
                    </span>
                  </div>

                  {/* Testimonial Text */}
                  <p className="font-semibold text-white text-xl sm:text-2xl lg:text-3xl leading-relaxed whitespace-pre-line mb-6 animate-fadeIn">
                    "{currentTestimonial.text}"
                  </p>

                  {/* Author Info */}
                  <div className="space-y-2">
                    <p className="font-bold text-cyan-400 text-xl sm:text-2xl">
                      {currentTestimonial.author}
                    </p>
                    <p className="font-medium text-gray-300 text-lg sm:text-xl">
                      {currentTestimonial.role}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Completed in {currentTestimonial.completionTime}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation arrows */}
        <Button
          onClick={prevTestimonial}
          className="absolute left-[-30px] sm:left-[-60px] top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-xl transition-all duration-300 hover:scale-110"
        >
          <span className="text-2xl sm:text-3xl font-bold">‹</span>
        </Button>

        <Button
          onClick={nextTestimonial}
          className="absolute right-[-30px] sm:right-[-60px] top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white border-none shadow-xl transition-all duration-300 hover:scale-110"
        >
          <span className="text-2xl sm:text-3xl font-bold">›</span>
        </Button>

        {/* Dots indicator */}
        <div className="flex justify-center mt-8 space-x-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-400 scale-125' 
                  : 'bg-gray-500 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};