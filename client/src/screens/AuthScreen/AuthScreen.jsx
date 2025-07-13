import React, { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { NavigationBarSection } from "../FrameScreen/sections/NavigationBarSection";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

export const AuthScreen = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 4) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = "Name is required";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms and conditions";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    if (isLogin) {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/login", // Replace with your actual API endpoint
          {
            email: formData.email,
            password: formData.password,
          }
        );
        // Show toast with message from API response
        toast.success(response.data.message || "Login successful!");

        // Optionally, store token/user info, then navigate
        setTimeout(() => {
          navigate("/"); // or your dashboard route
        }, 2000);
      } catch (error) {
        // Show error toast
        toast.error(
          error.response?.data?.message ||
            "Authentication failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Signup logic
      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/signup",
          {
            username: formData.name,
            email: formData.email,
            password: formData.password,
          }
        );
        toast.success(response.data.message || "Signup successful!");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Learning",
      description: "Personalized curriculum that adapts to your learning style",
    },
    {
      icon: "👨‍💼",
      title: "Expert Mentorship",
      description: "Get guidance from industry professionals",
    },
    {
      icon: "🚀",
      title: "Real Projects",
      description: "Build portfolio with actual industry projects",
    },
    {
      icon: "💼",
      title: "Career Support",
      description: "Job placement assistance and interview prep",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer at Google",
      text: "Infinite Learning transformed my career in just 6 months!",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Michael Chen",
      role: "Data Scientist at Microsoft",
      text: "The AI-powered learning path was exactly what I needed.",
      avatar:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
    {
      name: "Emily Rodriguez",
      role: "UX Designer at Apple",
      text: "Best investment I've made in my professional development.",
      avatar:
        "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
    },
  ];

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
          style={{ filter: "brightness(0.3) contrast(1.2)" }}
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

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            {/* Left Side - Features & Testimonials */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-poppins">
                  Transform Your Career
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Join over 50,000 students who have successfully transitioned
                  to tech careers with our AI-powered personalized learning
                  platform.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-white font-bold text-lg mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Testimonials */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-xl mb-4">
                  What Our Students Say
                </h3>
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm mb-1">
                          "{testimonial.text}"
                        </p>
                        <div className="text-cyan-400 font-semibold text-xs">
                          {testimonial.name}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="flex justify-center">
              <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl">
                <CardContent className="p-8">
                  {/* Form Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">{isLogin ? "🔐" : "🎓"}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2 font-poppins">
                      {isLogin ? "Welcome Back!" : "Join Infinite Learning"}
                    </h2>
                    <p className="text-gray-300">
                      {isLogin
                        ? "Sign in to continue your learning journey"
                        : "Start your transformation today"}
                    </p>
                  </div>

                  {/* Auth Toggle */}
                  <div className="flex bg-white/10 rounded-xl p-1 mb-8">
                    <button
                      onClick={() => setIsLogin(true)}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        isLogin
                          ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        !isLogin
                          ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field (Sign Up Only) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-white font-semibold mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`w-full p-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                            errors.name ? "border-red-500" : "border-white/20"
                          }`}
                          placeholder="Enter your full name"
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Email Field */}
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full p-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                          errors.email ? "border-red-500" : "border-white/20"
                        }`}
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div>
                      <label className="block text-white font-semibold mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full p-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                          errors.password ? "border-red-500" : "border-white/20"
                        }`}
                        placeholder="Enter your password"
                      />
                      {errors.password && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Field (Sign Up Only) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-white font-semibold mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`w-full p-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                            errors.confirmPassword
                              ? "border-red-500"
                              : "border-white/20"
                          }`}
                          placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Terms Checkbox (Sign Up Only) */}
                    {!isLogin && (
                      <div>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={handleInputChange}
                            className="mt-1 w-5 h-5 text-cyan-500 bg-white/10 border-white/20 rounded focus:ring-cyan-400"
                          />
                          <span className="text-gray-300 text-sm leading-relaxed">
                            I agree to the{" "}
                            <a
                              href="#"
                              className="text-cyan-400 hover:underline"
                            >
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a
                              href="#"
                              className="text-cyan-400 hover:underline"
                            >
                              Privacy Policy
                            </a>
                          </span>
                        </label>
                        {errors.agreeToTerms && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.agreeToTerms}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isLogin ? "Signing In..." : "Creating Account..."}
                        </div>
                      ) : isLogin ? (
                        "Sign In"
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    {/* Forgot Password (Login Only) */}
                    {isLogin && (
                      <div className="text-center">
                        <a
                          href="#"
                          className="text-cyan-400 hover:underline text-sm"
                        >
                          Forgot your password?
                        </a>
                      </div>
                    )}
                  </form>

                  {/* Social Login */}
                  <div className="mt-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-gray-400">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <Button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-300">
                        <span className="mr-2">🔍</span>
                        Google
                      </Button>
                      <Button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-300">
                        <span className="mr-2">💼</span>
                        LinkedIn
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
