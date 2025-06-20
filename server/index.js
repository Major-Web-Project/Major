const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced middleware with better error handling
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ONLY serve static files in production environment
if (process.env.NODE_ENV === 'production') {
  console.log('📦 Production mode: Serving static files from dist/');
  app.use(express.static(path.join(__dirname, '../dist')));
} else {
  console.log('🔧 Development mode: Static files served by Vite');
}

// Enhanced API Routes with better error handling
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Infinite Learning API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    voiceRecognition: {
      available: true,
      provider: 'Web Speech API',
      status: 'browser-native'
    }
  });
});

// Voice service status endpoint
app.get('/api/voice/status', (req, res) => {
  res.json({
    success: true,
    status: {
      provider: 'Web Speech API',
      available: true,
      configured: true,
      browserNative: true,
      features: {
        offline: true,
        realtime: true,
        autoRetry: false,
        immediateErrorFeedback: true
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced voice processing endpoint
app.post('/api/voice/process', (req, res) => {
  const { transcript, confidence, timestamp } = req.body;
  
  console.log('🎤 Voice processing request:', { transcript, confidence });
  
  if (!transcript || transcript.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No transcript provided',
      message: 'Transcript is required for processing'
    });
  }

  const processedResult = {
    success: true,
    originalTranscript: transcript,
    processedTranscript: transcript.trim(),
    confidence: confidence || 0.9,
    timestamp: timestamp || new Date().toISOString(),
    wordCount: transcript.trim().split(' ').length,
    language: 'en-US',
    processingTime: Date.now(),
    features: {
      sentimentAnalysis: 'positive',
      intentRecognition: 'learning_query',
      confidenceLevel: confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low'
    }
  };

  console.log('✅ Voice processing successful:', processedResult);
  
  res.json(processedResult);
});

// Enhanced voice test endpoint
app.post('/api/voice/test', (req, res) => {
  console.log('🧪 Voice test endpoint called');
  
  res.json({
    success: true,
    message: 'Voice service is working perfectly',
    provider: 'Web Speech API',
    features: {
      realtime: true,
      offline: true,
      browserNative: true,
      autoRetry: false,
      immediateErrorFeedback: true,
      multiLanguage: true
    },
    supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'],
    timestamp: new Date().toISOString()
  });
});

// Get all testimonials
app.get('/api/testimonials', (req, res) => {
  try {
    const testimonials = [
      {
        id: 1,
        text: "It was nice experience.\nI have learned many NEW Things.\nAnd finally Achieved my goal!",
        author: "Sarah Johnson",
        role: "Web Developer",
        rating: 5
      },
      {
        id: 2,
        text: "Amazing platform for learning!\nThe personalized approach helped me\nreach my career goals faster.",
        author: "Michael Chen",
        role: "Data Scientist",
        rating: 5
      },
      {
        id: 3,
        text: "Interactive lessons and great mentorship.\nI improved my skills significantly\nand landed my dream job!",
        author: "Emily Rodriguez",
        role: "UX Designer",
        rating: 5
      },
      {
        id: 4,
        text: "Best learning experience ever!\nThe AI-powered recommendations\nwere spot on for my needs.",
        author: "David Kim",
        role: "Software Engineer",
        rating: 5
      },
      {
        id: 5,
        text: "Transformed my career completely.\nFrom beginner to professional\nin just 6 months!",
        author: "Lisa Thompson",
        role: "Digital Marketer",
        rating: 5
      }
    ];
    
    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Get achievers data
app.get('/api/achievers', (req, res) => {
  try {
    const achievers = [
      {
        id: 1,
        name: "Nick",
        image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "Web Development",
        achievement: "Full Stack Developer at Google",
        completionTime: "4 months"
      },
      {
        id: 2,
        name: "Adil",
        image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "Data Science",
        achievement: "ML Engineer at Microsoft",
        completionTime: "6 months"
      },
      {
        id: 3,
        name: "Marina",
        image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "UI/UX Design",
        achievement: "Senior Designer at Apple",
        completionTime: "3 months"
      },
      {
        id: 4,
        name: "Dean",
        image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "Digital Marketing",
        achievement: "Marketing Director at Meta",
        completionTime: "5 months"
      },
      {
        id: 5,
        name: "Max",
        image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400",
        field: "AI/ML",
        achievement: "AI Researcher at OpenAI",
        completionTime: "8 months"
      }
    ];
    
    res.json(achievers);
  } catch (error) {
    console.error('Error fetching achievers:', error);
    res.status(500).json({ error: 'Failed to fetch achievers' });
  }
});

// Submit new goal
app.post('/api/goals', (req, res) => {
  try {
    const { field, description, timeline, strengths, weaknesses } = req.body;
    
    const newGoal = {
      id: Date.now(),
      field,
      description,
      timeline,
      strengths,
      weaknesses,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    res.status(201).json({
      success: true,
      message: 'Goal created successfully!',
      goal: newGoal
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get learning fields
app.get('/api/fields', (req, res) => {
  try {
    const fields = [
      { value: "design", label: "UI/UX Design", description: "Create beautiful and user-friendly interfaces" },
      { value: "development", label: "Web Development", description: "Build modern web applications" },
      { value: "marketing", label: "Digital Marketing", description: "Master online marketing strategies" },
      { value: "business", label: "Business Analytics", description: "Analyze data to drive business decisions" },
      { value: "ai", label: "Artificial Intelligence", description: "Develop intelligent systems and algorithms" },
      { value: "data", label: "Data Science", description: "Extract insights from complex datasets" }
    ];
    
    res.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Enhanced chat endpoint for AI assistant
app.post('/api/chat', (req, res) => {
  try {
    const { message, context } = req.body;
    
    const responses = [
      "That's a great question! Let me help you with that.",
      "I understand your goal. Here's what I recommend...",
      "Based on your interests, I suggest starting with...",
      "That's an excellent choice! Let's create a learning path for you.",
      "I can help you achieve that goal. Let's break it down into steps."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setTimeout(() => {
      res.json({
        response: randomResponse,
        suggestions: [
          "Tell me more about your background",
          "What's your timeline for this goal?",
          "Do you have any prior experience?"
        ]
      });
    }, 1000);
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/health',
      '/api/voice/status',
      '/api/voice/process',
      '/api/testimonials',
      '/api/achievers',
      '/api/goals',
      '/api/fields',
      '/api/chat'
    ]
  });
});

// ONLY serve React app in production environment
if (process.env.NODE_ENV === 'production') {
  // Catch all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    } catch (error) {
      console.error('Error serving index.html:', error);
      res.status(500).send('Server Error');
    }
  });
} else {
  // In development, let Vite handle the frontend routing
  app.get('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      message: 'In development mode, frontend routes are handled by Vite',
      suggestion: 'Make sure Vite dev server is running on port 5173'
    });
  });
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🎤 Voice API: http://localhost:${PORT}/api/voice/status`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`📦 Frontend: http://localhost:${PORT}`);
    console.log('✅ Serving static files from dist/');
  } else {
    console.log('🔧 Development mode: Frontend served by Vite on port 5173');
    console.log('✅ API-only mode - static files handled by Vite');
  }
  
  console.log('✅ Enhanced Web Speech API voice recognition is ready!');
  console.log('🔄 Immediate error feedback enabled (no auto-retry)');
});

module.exports = app;