import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate from react-router-dom
import { NavigationMenu } from "../../../../components/ui/navigation-menu";
import {
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../../../../components/ui/navigation-menu";
import { useTheme } from "../../../../lib/ThemeContext";

export const NavigationBarSection = ({ user, isAuthenticated, handleLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      label: "Home",
      to: "/", // Change href to to
    },
    {
      label: "Dashboard",
      to: "/dashboard", // Change href to to
    },
    {
      label: "Learning Dashboard",
      to: "/learning-dashboard", // Change href to to
    },
    {
      label: "Tasks",
      to: "/tasks", // Change href to to
    },
    {
      label: "About",
      to: "/about", // Change href to to
    },
  ];

  // Add authentication item conditionally
  if (!isAuthenticated) {
    navItems.push({
      label: "Sign up / Login",
      to: "/auth",
    });
  }

  return (
    <>
      <header className="w-full h-auto lg:h-[91px] flex flex-col lg:flex-row items-center justify-between p-4 lg:px-8 bg-black/20 backdrop-blur-md border-b border-white/10 shadow-lg sticky top-0 z-40">
        {/* Logo */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div className="relative flex items-center gap-3 group">
            {/* Infinite Learning Logo */}
            <div className="relative w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-500 overflow-hidden">
              {/* Infinity symbol with learning elements */}
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
                {/* Learning dots */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce animation-delay-500"></div>
              </div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-cyan-400/30 rounded-2xl blur-xl animate-pulse"></div>
            </div>

            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-bold text-2xl lg:text-3xl leading-tight font-poppins">
                Infinite Learning
              </div>
              <div className="font-medium text-gray-300 text-xs tracking-[2px] uppercase font-inter">
                Endless Possibilities
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-300"
          >
            <span className="text-xl">{isMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row items-center w-full lg:w-auto mt-4 lg:mt-0`}
        >
          <NavigationMenu className="max-w-none">
            <NavigationMenuList className="flex flex-col lg:flex-row items-center gap-2 lg:gap-6 w-full lg:w-auto">
              {navItems.map((item, index) => (
                <NavigationMenuItem key={index} className="w-full lg:w-auto">
                  <NavigationMenuLink asChild>
                    <Link
                      to={item.to}
                      className="flex items-center gap-2 font-medium text-indigo-700 hover:text-sky-700 hover:scale-105 transition-all duration-300 text-base lg:text-lg px-4 py-3 lg:py-2 rounded-xl hover:bg-white/10 font-inter w-full lg:w-auto justify-center lg:justify-start group cursor-pointer dark:text-gray-300 dark:hover:text-cyan-400"
                    >
                      <span className="text-lg group-hover:scale-125 transition-transform duration-300">
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
              {/* User Profile and Logout when authenticated */}
              {isAuthenticated && user && (
                <>
                  <NavigationMenuItem className="w-full lg:w-auto flex items-center">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 font-medium text-indigo-700 hover:text-sky-700 hover:scale-105 transition-all duration-300 text-base lg:text-lg px-4 py-3 lg:py-2 rounded-xl hover:bg-white/10 font-inter w-full lg:w-auto justify-center lg:justify-start group cursor-pointer dark:text-gray-300 dark:hover:text-cyan-400"
                      >
                        <img
                          src={user.avatar || "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400"}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="ml-2 text-indigo-700 dark:text-gray-300">
                          {user.username.length > 6
                            ? user.username.slice(0, 6) + '..'
                            : user.username}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                    <button
                      onClick={handleLogout}
                      className="ml-4 flex items-center gap-2 font-medium text-indigo-700 hover:text-red-600 hover:scale-105 transition-all duration-300 text-base lg:text-lg px-4 py-3 lg:py-2 rounded-xl hover:bg-white/10 font-inter group cursor-pointer dark:text-gray-300 dark:hover:text-red-400"
                    >
                      Logout
                    </button>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Settings Icon (opens modal) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="w-[36px] h-[36px] bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer shadow-lg group"
            title="Settings"
          >
            <svg
              className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>
      {/* Settings Modal (to be implemented) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-background text-primary rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slideInUp border border-border">
            <button
              className="absolute top-4 right-4 text-2xl text-sky-600 hover:text-red-500 transition-colors dark:text-gray-400 dark:hover:text-red-400"
              onClick={() => setShowSettings(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            {/* Theme Toggle */}
            <div className="mb-8 flex items-center gap-4">
              <span className="font-medium">Theme:</span>
              <button
                onClick={toggleTheme}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 border border-border focus:outline-none shadow-sm ${theme === 'dark' ? 'bg-[#2A125E] text-white hover:bg-[#1B0C3B]' : 'bg-[#EAE6F8] text-[#222222] hover:bg-[#E5F0FF]'}`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? 'Dark' : 'Light'} Mode
              </button>
            </div>
            {/* Change Password (only if logged in) */}
            {isAuthenticated && user && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Change Password</h3>
                {/* Placeholder for change password form */}
                <div className="bg-accent rounded-lg p-4 border border-border">
                  <p className="text-secondary mb-2">Password change form coming soon!</p>
                  {/* TODO: Implement change password form and connect to backend */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
