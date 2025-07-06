import React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../../../components/ui/avatar';
import { Card, CardContent } from '../../../../components/ui/card';
import { achievers } from '../../../../data/mockData';

export const AchieversSection = () => {
  return (
    <section className="w-full py-16 sm:py-20 bg-gradient-to-b from-transparent to-black/20">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-bold text-white text-3xl sm:text-4xl lg:text-5xl xl:text-6xl leading-tight mb-4 font-poppins">
            Our Success Stories
          </h2>
          <p className="text-gray-300 text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto">
            Meet the amazing individuals who transformed their careers with our
            platform
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
          <CardContent className="p-8 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8">
              {achievers.map((achiever, index) => (
                <div
                  key={achiever.id}
                  className="flex flex-col items-center group hover:transform hover:scale-105 transition-all duration-500 animate-slideInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Profile Container */}
                  <div
                    className={`relative w-full max-w-[200px] aspect-square p-1 rounded-full bg-gradient-to-r ${achiever.bgColor} mb-4`}
                  >
                    <div
                      className={`w-full h-full p-1 rounded-full bg-gradient-to-r ${achiever.borderColor}`}
                    >
                      <Avatar className="w-full h-full border-4 border-white/20 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500">
                        <AvatarImage
                          src={achiever.image}
                          alt={achiever.name}
                          className="w-full h-full object-cover"
                        />
                        <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 text-white">
                          {achiever.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Floating badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <span className="text-lg">🏆</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center space-y-2">
                    <h3
                      className={`font-bold text-2xl sm:text-3xl lg:text-4xl ${achiever.textColor} group-hover:scale-110 transition-transform duration-300`}
                    >
                      {achiever.name}
                    </h3>
                    <p className="text-white font-semibold text-sm sm:text-base">
                      {achiever.achievement}
                    </p>
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-300 text-xs sm:text-sm">
                      <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm font-medium">
                        {achiever.course}
                      </span>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                          {achiever.field}
                        </span>
                        <span className="px-2 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                          {achiever.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
