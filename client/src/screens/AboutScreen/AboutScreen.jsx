import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { currentUser, availableCourses, achievers } from "../../data/mockData";

export const AboutScreen = () => {
  const stats = [
    { label: "Students Worldwide", value: "50,000+", icon: "👥" },
    { label: "Expert Instructors", value: "200+", icon: "👨‍🏫" },
    { label: "Courses Available", value: "100+", icon: "📚" },
    { label: "Success Rate", value: "95%", icon: "🎯" },
    { label: "Countries Reached", value: "80+", icon: "🌍" },
    { label: "Hours of Content", value: "10,000+", icon: "⏰" }
  ];

  const features = [
    {
      title: "AI-Powered Learning",
      description: "Personalized learning paths powered by advanced AI algorithms that adapt to your learning style and pace.",
      icon: "🤖",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Expert Mentorship",
      description: "Get guidance from industry professionals with years of experience in their respective fields.",
      icon: "👨‍💼",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Real-World Projects",
      description: "Work on actual industry projects that build your portfolio and prepare you for real challenges.",
      icon: "🚀",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Interactive Learning",
      description: "Engage with interactive coding environments, simulations, and hands-on exercises.",
      icon: "💻",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Career Support",
      description: "Comprehensive career services including resume reviews, interview prep, and job placement assistance.",
      icon: "💼",
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Community Learning",
      description: "Join a vibrant community of learners, share knowledge, and collaborate on projects.",
      icon: "🤝",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const team = [
    {
      name: "Dr. Sarah Chen",
      role: "Founder & CEO",
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
      bio: "Former Google AI researcher with 15+ years in educational technology.",
      linkedin: "#"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
      bio: "Ex-Microsoft engineer specializing in scalable learning platforms.",
      linkedin: "#"
    },
    {
      name: "Emily Johnson",
      role: "Head of Curriculum",
      image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
      bio: "Educational expert with PhD in Learning Sciences from Stanford.",
      linkedin: "#"
    },
    {
      name: "David Kim",
      role: "Head of Student Success",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
      bio: "Career counselor helping 1000+ students transition to tech careers.",
      linkedin: "#"
    }
  ];

  const values = [
    {
      title: "Innovation",
      description: "We constantly push the boundaries of educational technology to create better learning experiences.",
      icon: "💡"
    },
    {
      title: "Accessibility",
      description: "Quality education should be accessible to everyone, regardless of background or location.",
      icon: "🌐"
    },
    {
      title: "Excellence",
      description: "We maintain the highest standards in content quality, instruction, and student support.",
      icon: "⭐"
    },
    {
      title: "Community",
      description: "Learning is better together. We foster a supportive community of learners and educators.",
      icon: "❤️"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-mint-100 text-indigo-700 dark:bg-background dark:text-primary">
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-poppins">
              About Infinite Learning
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed dark:text-gray-300">
              Transforming lives through cutting-edge education technology and personalized learning experiences. 
              We believe everyone deserves access to world-class education that adapts to their unique journey.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-16 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎯</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-indigo-700 mb-6 font-poppins dark:text-white">Our Mission</h2>
                <p className="text-lg sm:text-xl text-sky-700 leading-relaxed max-w-4xl mx-auto dark:text-gray-300">
                  To democratize access to high-quality, personalized education by leveraging artificial intelligence 
                  and innovative teaching methodologies. We're committed to helping learners achieve their career goals 
                  through practical, industry-relevant skills and continuous support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 dark:bg-white/10 dark:border-white/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{stat.icon}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-2 dark:text-white">{stat.value}</div>
                  <div className="text-sky-600 text-sm font-medium dark:text-gray-300">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white text-center mb-12 font-poppins">
              What Makes Us Different
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 dark:bg-white/10 dark:border-white/20">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                      <span className="text-3xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-indigo-700 mb-4 dark:text-white">{feature.title}</h3>
                    <p className="text-sky-700 leading-relaxed dark:text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Our Story */}
          <Card className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-16 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-bold text-indigo-700 mb-6 font-poppins dark:text-white">Our Story</h2>
                  <div className="space-y-6 text-sky-700 text-lg leading-relaxed dark:text-gray-300">
                    <p>
                      Founded in 2020 by a team of educators and technologists, Infinite Learning was born from 
                      a simple observation: traditional education wasn't keeping pace with the rapidly evolving 
                      demands of the modern workforce.
                    </p>
                    <p>
                      We started with a vision to create an educational platform that could adapt to each learner's 
                      unique needs, learning style, and career goals. Using cutting-edge AI and machine learning 
                      technologies, we've built a system that personalizes the learning experience like never before.
                    </p>
                    <p>
                      Today, we're proud to have helped over 50,000 students worldwide transition into successful 
                      tech careers, with a 95% job placement rate and partnerships with leading companies across 
                      the globe.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="grid grid-cols-2 gap-4">
                    <img 
                      src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800" 
                      alt="Learning Environment" 
                      className="rounded-2xl shadow-xl"
                    />
                    <img 
                      src="https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800" 
                      alt="AI Technology" 
                      className="rounded-2xl shadow-xl mt-8"
                    />
                    <img 
                      src="https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg?auto=compress&cs=tinysrgb&w=800" 
                      alt="Student Success" 
                      className="rounded-2xl shadow-xl -mt-8"
                    />
                    <img 
                      src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800" 
                      alt="Innovation" 
                      className="rounded-2xl shadow-xl"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white text-center mb-12 font-poppins">
              Meet Our Leadership Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 dark:bg-white/10 dark:border-white/20">
                  <CardContent className="p-8 text-center">
                    <div className="relative mb-6">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-sky-200/50 dark:border-white/20"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">💼</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-indigo-700 mb-2 dark:text-white">{member.name}</h3>
                    <p className="text-cyan-400 font-semibold mb-4">{member.role}</p>
                    <p className="text-sky-700 text-sm leading-relaxed mb-4 dark:text-gray-300">{member.bio}</p>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-lg">
                      Connect on LinkedIn
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white text-center mb-12 font-poppins">
              Our Core Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300 dark:bg-white/10 dark:border-white/20">
                  <CardContent className="p-8 text-center">
                    <div className="text-5xl mb-6">{value.icon}</div>
                    <h3 className="text-xl font-bold text-indigo-700 mb-4 dark:text-white">{value.title}</h3>
                    <p className="text-sky-700 leading-relaxed dark:text-gray-300">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Success Stories Preview */}
          <Card className="bg-sky-100/50 backdrop-blur-md border border-sky-200/50 rounded-3xl shadow-2xl mb-16 dark:bg-white/10 dark:border-white/20">
            <CardContent className="p-8 sm:p-12">
              <h2 className="text-4xl font-bold text-white text-center mb-12 font-poppins">
                Success Stories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {achievers.slice(0, 3).map((achiever, index) => (
                  <div key={index} className="text-center">
                    <div className={`relative w-24 h-24 mx-auto mb-4 p-1 rounded-full bg-gradient-to-r ${achiever.bgColor}`}>
                      <img src={achiever.image} alt={achiever.name} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <h3 className={`text-xl font-bold ${achiever.textColor} mb-2`}>{achiever.name}</h3>
                    <p className="text-white font-semibold mb-2">{achiever.achievement}</p>
                    <p className="text-gray-300 text-sm">{achiever.course}</p>
                    <p className="text-gray-400 text-xs mt-1">Completed in {achiever.duration}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};