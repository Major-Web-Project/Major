import React from 'react';

export const ConclusionSection = () => {
  const footerData = [
    {
      title: 'Our Services',
      icon: '🎯',
      content:
        'AI-powered personalized learning paths, interactive coding environments, real-time mentorship, career guidance, and project-based learning to help you achieve your professional goals.',
    },
    {
      title: 'Contact Us',
      icon: '📞',
      content:
        '📧 hello@infinitelearning.com\n📱 +1 (555) 123-4567\n📍 123 Learning Street\nEducation City, EC 12345\n\n🕒 Support Hours:\nMon-Fri: 9AM-6PM EST',
    },
    {
      title: 'About Infinite Learning',
      icon: '🚀',
      content:
        'Infinite Learning is a cutting-edge educational platform that combines artificial intelligence with human expertise to deliver personalized learning experiences. We believe in empowering individuals through technology-enhanced education.',
    },
    {
      title: 'Our Impact',
      icon: '📈',
      content:
        '✅ 50,000+ Students Trained\n✅ 95% Job Placement Rate\n✅ 200+ Corporate Partners\n✅ 24/7 AI Learning Assistant\n✅ Interactive Learning Environment\n✅ Real-world Projects',
    },
  ];

  const socialLinks = [
    { name: 'Twitter', icon: '🐦', href: '#' },
    { name: 'LinkedIn', icon: '💼', href: '#' },
    { name: 'GitHub', icon: '🐙', href: '#' },
    { name: 'Discord', icon: '💬', href: '#' },
  ];

  return (
    <footer className="w-full py-16 sm:py-20 bg-gradient-to-br from-black/40 via-purple-900/20 to-black/40 backdrop-blur-md border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {footerData.map((section, index) => (
            <div
              key={index}
              className="flex flex-col space-y-4 animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{section.icon}</span>
                <h3 className="font-bold text-xl sm:text-2xl text-cyan-400 tracking-wide">
                  {section.title}
                </h3>
              </div>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Updated Logo */}
              <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
                <div className="relative">
                  <svg
                    width="32"
                    height="20"
                    viewBox="0 0 32 20"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M8 10C8 6 10 4 14 4C18 4 20 6 20 10C20 14 18 16 14 16C10 16 8 14 8 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse"
                    />
                    <path
                      d="M24 10C24 6 22 4 18 4C14 4 12 6 12 10C12 14 14 16 18 16C22 16 24 14 24 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="animate-pulse animation-delay-300"
                    />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce animation-delay-500"></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-cyan-400/30 rounded-2xl blur-xl animate-pulse"></div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Infinite Learning
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-all duration-300 hover:scale-110 group"
                >
                  <span className="text-2xl group-hover:animate-bounce">
                    {social.icon}
                  </span>
                  <span className="hidden sm:inline font-medium">
                    {social.name}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm sm:text-base">
              © 2025 Infinite Learning. All rights reserved. | Empowering minds
              through technology.
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <a
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
