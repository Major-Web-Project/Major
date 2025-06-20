import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { aiAssistant } from '../../../../services/aiLearningService';
import { webSpeechVoiceService } from '../../../../services/webSpeechVoiceService';

export const ChatboxSection = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! I\'m your AI learning assistant. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('ready');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // ONLY scroll the messages container internally - NEVER the page
  const scrollMessagesToBottom = () => {
    if (messagesEndRef.current && messagesContainerRef.current && hasUserInteracted) {
      // Use scrollTop instead of scrollIntoView to avoid page movement
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll for BOTH user and AI messages - INTERNAL SCROLL ONLY
  useEffect(() => {
    if (hasUserInteracted && messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      
      // Scroll for both user and AI messages
      if (lastMessage.sender === 'user' || lastMessage.sender === 'ai') {
        // Small delay to ensure message is rendered, then scroll internally
        setTimeout(() => {
          scrollMessagesToBottom();
        }, 100);
      }
    }
  }, [messages.length, hasUserInteracted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      webSpeechVoiceService.cleanup();
    };
  }, []);

  // Start voice recognition
  const startWebSpeechRecording = async () => {
    console.log('🎤 Starting voice recognition');
    
    if (!webSpeechVoiceService.isServiceSupported()) {
      setVoiceStatus('error');
      const errorMessage = {
        id: Date.now(),
        text: 'Voice recognition is not supported in this browser. Please use Chrome, Firefox, Safari, or Edge for voice features.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'error',
        suggestions: ['Use Chrome browser', 'Update browser', 'Continue with text input']
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => {
        setVoiceStatus('ready');
      }, 3000);
      return;
    }

    setHasUserInteracted(true);
    setIsRecording(true);
    setRecordingTime(0);
    setCurrentTranscript('');
    setIsProcessing(false);
    setVoiceStatus('listening');

    // Start recording timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    const success = await webSpeechVoiceService.startListening({
      onStart: () => {
        console.log('✅ Voice recognition started');
        setIsRecording(true);
        setVoiceStatus('listening');
      },

      onInterimResult: (result) => {
        console.log('📝 Interim transcription:', result.transcript);
        setCurrentTranscript(result.transcript);
        setInputMessage(result.transcript);
      },

      onResult: (result) => {
        console.log('🎯 Final transcription:', result.transcript);
        
        setIsRecording(false);
        setVoiceStatus('processing');
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }

        const voiceMessage = {
          id: Date.now(),
          text: `🎤 Voice: "${result.transcript}"`,
          sender: 'user',
          timestamp: new Date(),
          type: 'voice',
          confidence: Math.round(result.confidence * 100),
          originalTranscript: result.transcript,
        };

        setMessages(prev => [...prev, voiceMessage]);
        setInputMessage('');
        setCurrentTranscript('');

        processMessage(result.transcript, result.confidence);
      },

      onError: (error) => {
        console.error('❌ Voice recognition error:', error);
        setIsRecording(false);
        setIsProcessing(false);
        setCurrentTranscript('');
        setVoiceStatus('error');
        
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }

        const errorMessage = {
          id: Date.now(),
          text: `❌ Voice Error: ${error.message}`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'error',
          suggestions: error.suggestions || ['Try again', 'Use text input instead']
        };

        setMessages(prev => [...prev, errorMessage]);

        setTimeout(() => {
          setVoiceStatus('ready');
        }, 3000);
      },

      onEnd: () => {
        console.log('🛑 Voice recognition ended');
        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        
        if (voiceStatus !== 'processing') {
          setVoiceStatus('ready');
        }
      }
    });

    if (!success) {
      setIsRecording(false);
      setVoiceStatus('error');
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      setTimeout(() => {
        setVoiceStatus('ready');
      }, 3000);
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    console.log('🛑 Stopping voice recording');
    webSpeechVoiceService.stopListening();
    setIsRecording(false);
    setCurrentTranscript('');
    setVoiceStatus('ready');
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Process voice message
  const processMessage = async (transcript, confidence) => {
    console.log(`🚀 Processing message: "${transcript}"`);
    
    setIsTyping(true);
    setVoiceStatus('processing');
    
    try {
      const learningContext = {
        learningData: window.learningData || null,
        userProfile: window.userProfile || null,
        currentProgress: window.currentProgress || null
      };

      const aiResponse = aiAssistant.processMessage(transcript, learningContext);
      
      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponse.response,
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
          suggestions: aiResponse.suggestions,
          voiceResponse: true
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        setVoiceStatus('ready');
      }, 1000);

    } catch (error) {
      console.error('Error processing message:', error);
      
      setTimeout(() => {
        const fallbackResponse = {
          id: Date.now() + 1,
          text: `I heard: "${transcript}"\n\nHow can I help you with that?`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
          suggestions: [
            "Tell me more",
            "How can I help?",
            "What do you need?",
            "Ask me anything"
          ]
        };
        
        setMessages(prev => [...prev, fallbackResponse]);
        setIsTyping(false);
        setVoiceStatus('ready');
      }, 1000);
    }
  };

  // Send text message with auto-scroll
  const sendMessage = async () => {
    if (inputMessage.trim() && !isProcessing) {
      setHasUserInteracted(true);
      setIsProcessing(true);

      const userMessage = inputMessage.trim();
      const newMessage = {
        id: Date.now(),
        text: userMessage,
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
      };

      // Add user message and it will auto-scroll via useEffect
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage('');
      setIsTyping(true);

      try {
        const learningContext = {
          learningData: window.learningData || null,
          userProfile: window.userProfile || null,
          currentProgress: window.currentProgress || null
        };

        const aiResponse = aiAssistant.processMessage(userMessage, learningContext);
        
        setTimeout(() => {
          const aiMessage = {
            id: Date.now() + 1,
            text: aiResponse.response,
            sender: 'ai',
            timestamp: new Date(),
            type: 'text',
            suggestions: aiResponse.suggestions
          };

          // Add AI message and it will auto-scroll via useEffect
          setMessages((prev) => [...prev, aiMessage]);
          setIsTyping(false);
          setIsProcessing(false);
        }, 1000);

      } catch (error) {
        console.error('Error processing message:', error);
        
        setTimeout(() => {
          const fallbackResponse = {
            id: Date.now() + 1,
            text: "I'm here to help with your learning journey! What would you like to know?",
            sender: 'ai',
            timestamp: new Date(),
            type: 'text',
            suggestions: [
              "Show my progress",
              "Help with tasks",
              "Plan studies",
              "Get motivation"
            ]
          };
          
          setMessages((prev) => [...prev, fallbackResponse]);
          setIsTyping(false);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  // Handle suggestion clicks with auto-scroll
  const handleSuggestionClick = async (suggestion) => {
    if (isProcessing) return;
    
    setHasUserInteracted(true);
    setIsProcessing(true);

    const newMessage = {
      id: Date.now(),
      text: suggestion,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    // Add user message and it will auto-scroll via useEffect
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    try {
      const learningContext = {
        learningData: window.learningData || null,
        userProfile: window.userProfile || null,
        currentProgress: window.currentProgress || null
      };

      const aiResponse = aiAssistant.processMessage(suggestion, learningContext);
      
      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          text: aiResponse.response,
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
          suggestions: aiResponse.suggestions
        };

        // Add AI message and it will auto-scroll via useEffect
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
        setIsProcessing(false);
      }, 1000);

    } catch (error) {
      console.error('Error processing suggestion:', error);
      
      setTimeout(() => {
        const fallbackResponse = {
          id: Date.now() + 1,
          text: "I'm here to help! What would you like to know?",
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
          suggestions: [
            "Show progress",
            "Help with tasks",
            "Plan studies",
            "Get tips"
          ]
        };
        
        setMessages((prev) => [...prev, fallbackResponse]);
        setIsTyping(false);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputFocus = () => {
    setHasUserInteracted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get voice button appearance based on status
  const getVoiceButtonStyle = () => {
    switch (voiceStatus) {
      case 'listening':
        return 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse';
      case 'processing':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'error':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-purple-500';
    }
  };

  const getVoiceButtonIcon = () => {
    switch (voiceStatus) {
      case 'listening':
        return <div className="w-3 h-3 bg-white rounded-sm"></div>;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>;
      case 'error':
        return '⚠️';
      default:
        return (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        );
    }
  };

  const getVoiceButtonTitle = () => {
    switch (voiceStatus) {
      case 'listening':
        return 'Stop voice recording';
      case 'processing':
        return 'Processing voice input...';
      case 'error':
        return 'Voice recognition error - click to retry';
      default:
        return 'Start voice recognition';
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto my-12 sm:my-16 px-4 sm:px-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-poppins">
          Chat with Your AI Learning Assistant
        </h2>
        <p className="text-gray-300 text-lg sm:text-xl">
          Get personalized guidance with voice and text interaction
        </p>
      </div>

      {/* COMPLETELY STABLE CHATBOX - ZERO PAGE MOVEMENT */}
      <div className="relative w-full h-[600px] sm:h-[700px] bg-gradient-to-br from-white/10 to-black/20 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
        
        {/* MESSAGES AREA - INTERNAL SCROLL ONLY */}
        <div 
          ref={messagesContainerRef}
          className="absolute top-0 left-0 right-0 bottom-[120px] p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar"
          style={{
            scrollBehavior: 'smooth',
            overflowAnchor: 'none' // Prevent automatic scroll anchoring
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } animate-slideInUp`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[400px] ${
                  message.sender === 'user' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div
                  className={`relative p-4 sm:p-6 rounded-2xl shadow-lg border transition-all duration-300 hover:scale-105 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400/30'
                      : message.type === 'error'
                      ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white border-red-400/30 backdrop-blur-sm'
                      : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-400/30 backdrop-blur-sm'
                  }`}
                >
                  {/* Voice message indicator */}
                  {message.type === 'voice' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎤</span>
                      <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full text-green-400">
                        {message.confidence}% confidence
                      </span>
                    </div>
                  )}

                  {/* Error indicator */}
                  {message.type === 'error' && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="text-xs bg-red-500/20 px-2 py-1 rounded-full text-red-400">
                        ERROR
                      </span>
                    </div>
                  )}

                  <div className="font-medium text-base leading-relaxed">
                    {message.text}
                  </div>

                  <div
                    className={`text-xs mt-2 ${
                      message.sender === 'user'
                        ? 'text-cyan-100'
                        : 'text-gray-300'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* AI Suggestions */}
                {message.sender === 'ai' && message.suggestions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full border border-white/20 transition-all duration-300 hover:scale-105"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="max-w-[400px]">
                <div className="relative p-6 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-400/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                    <span className="text-sm text-purple-300">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ABSOLUTELY FIXED INPUT AREA - NEVER MOVES */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm border-t border-white/10">
          <div className="relative w-full h-[60px] sm:h-[70px] bg-gradient-to-r from-gray-900/95 to-black/95 rounded-full flex items-center px-4 sm:px-6 shadow-xl border border-white/20 backdrop-blur-md">
            
            {/* AI button */}
            <Button className="w-[40px] sm:w-[45px] h-[40px] sm:h-[45px] bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mr-3 hover:scale-110 transition-transform duration-300 border-0 text-lg sm:text-xl flex-shrink-0">
              🤖
            </Button>

            {/* Input field */}
            <div className="flex-1 mx-2 sm:mx-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder={
                  isRecording
                    ? `🎤 Recording... ${formatTime(recordingTime)} - ${currentTranscript || 'Speak now...'}`
                    : isProcessing
                    ? 'Processing...'
                    : 'Type your message or use voice recognition...'
                }
                className="w-full bg-transparent text-white text-base sm:text-lg placeholder-gray-400 outline-none"
                disabled={isRecording || isProcessing}
              />
            </div>

            {/* Send button */}
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isRecording || isProcessing}
              className="w-[40px] sm:w-[45px] h-[40px] sm:h-[45px] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 hover:scale-110 transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>

            {/* Voice recording button */}
            <Button
              onClick={isRecording ? stopVoiceRecording : startWebSpeechRecording}
              disabled={isProcessing}
              className={`w-[40px] sm:w-[45px] h-[40px] sm:h-[45px] rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 border-0 disabled:opacity-50 flex-shrink-0 ${getVoiceButtonStyle()}`}
              title={getVoiceButtonTitle()}
            >
              {getVoiceButtonIcon()}
            </Button>
          </div>

          {/* Recording status - positioned relative to input area */}
          {isRecording && (
            <div className="mt-4 flex justify-center">
              <div className="bg-red-500/90 text-white px-6 py-3 rounded-full text-sm animate-pulse backdrop-blur-sm border border-red-400/30">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-4 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-4 bg-white rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2 h-4 bg-white rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                  <span className="font-medium">
                    🎤 Recording: {formatTime(recordingTime)}
                  </span>
                  {currentTranscript && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      "{currentTranscript}"
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Voice status indicator */}
          {voiceStatus === 'processing' && (
            <div className="mt-4 flex justify-center">
              <div className="bg-yellow-500/90 text-white px-6 py-3 rounded-full text-sm backdrop-blur-sm border border-yellow-400/30">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">Processing voice input...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};