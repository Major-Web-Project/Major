# 🚀 Infinite Learning Platform - Startup Guide

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional)

## 🛠️ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
The `.env` file is already configured with default values. No changes needed for local development.

### 3. Start Development Server
```bash
npm run dev
```

This will start:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173

## 🎯 Available Commands

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run server

# Start only frontend  
npm run client

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Troubleshooting

### Port 5173 Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or manually find and kill
lsof -i :5173
kill -9 <PID>
```

### CSS/Tailwind Not Loading
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force
npm install
```

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Terminal Output:**
   ```
   [server] 🚀 Server is running on port 5000
   [client] ➜ Local: http://localhost:5173/
   [client] ➜ Ready in 500ms
   ```

2. **Browser:** Beautiful responsive website with:
   - Gradient backgrounds
   - Smooth animations
   - Interactive elements
   - AI chat functionality

## 🌐 Features Available

✅ **Frontend Features:**
- Interactive landing page with video background
- AI-powered chat with voice recognition
- Goal selection system
- Success stories carousel
- Responsive design with Tailwind CSS
- Dashboard with charts and analytics
- Task management system

✅ **Backend Features:**
- REST API endpoints
- Health monitoring
- Voice processing
- Data management
- CORS enabled

## 🎨 Design System

The platform uses:
- **Tailwind CSS** for styling
- **Custom animations** and transitions
- **Gradient backgrounds** and glass morphism
- **Responsive design** for all devices
- **Dark theme** with purple/cyan accents

## 🚨 Common Issues & Solutions

### 1. White Screen / No Styles
- Check if Tailwind CSS is loading
- Verify `tailwind.config.js` is in root
- Restart development server

### 2. API Errors
- Ensure backend is running on port 5000
- Check `.env` configuration
- Verify CORS settings

### 3. Voice Recognition Not Working
- Use Chrome, Firefox, Safari, or Edge
- Allow microphone permissions
- Check HTTPS in production

## 📱 Mobile Testing

Test on mobile devices:
- Responsive design works on all screen sizes
- Touch interactions are optimized
- Voice recognition works on mobile browsers

## 🚀 Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🆘 Need Help?

If you encounter issues:
1. Check Node.js version: `node --version`
2. Clear browser cache
3. Restart development server
4. Check console for errors (F12)

## 🎉 You're Ready!

Your Infinite Learning Platform should now be running with:
- Beautiful UI with proper styling
- Working animations and interactions
- AI chat functionality
- Voice recognition
- Responsive design

Happy coding! 🚀