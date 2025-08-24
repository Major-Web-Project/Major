# Infinite Learning Platform

A modern, AI-powered learning platform that provides personalized learning paths, interactive coding environments, and expert mentorship to help users transform their careers.

## 🚀 Project Overview

The Infinite Learning Platform is a full-stack web application built with React (Frontend) and Node.js/Express (Backend). It features a responsive UI with dashboard components, task management, AI chat functionality, and personalized learning paths.

### 🏗️ Architecture

- **Frontend**: React with Vite, Tailwind CSS, React Router
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based authentication
- **Deployment**: Ready for production with build optimizations

## 📁 Project Structure

```
infinite-learning-platform/
├── client/                 # React frontend application
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Page components
│   │   └── ...
│   ├── public/             # Static assets
│   └── ...
├── server/                 # Node.js backend application
│   ├── routes/             # API route definitions
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   └── ...
└── README.md              # This file
```

## 🛠️ Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (local or cloud instance)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd infinite-learning-platform
```

### 2. Install Dependencies

Navigate to both client and server directories to install dependencies:

```bash
# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Environment Setup

#### Client Environment (client/.env)

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

#### Server Environment (server/.env)

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/infinite-learning

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

> ⚠️ **Important**: Change the JWT_SECRET in production to a strong, unique key.

### 4. Start MongoDB

Make sure MongoDB is running locally, or configure the MONGODB_URI to point to a MongoDB Atlas instance.

### 5. Run the Application

You can run the frontend and backend separately or concurrently:

#### Option 1: Run Both Together

From the root directory:

```bash
# You'll need to run commands in separate terminals or use a tool like concurrently
```

#### Option 2: Run Separately

**Terminal 1 - Backend Server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend Client:**

```bash
cd client
npm run dev
```

### 6. Access the Application

After running the commands above, your application will be available at:

- **Frontend (React):** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

## 📱 Available Scripts

### Client (in `client/` directory):

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Server (in `server/` directory):

```bash
# Development with auto-restart
npm run dev

# Start production server
npm start
```

## 🎯 Key Features

### Frontend Features:

- 🎨 **Responsive Design**: Works on all device sizes
- 📊 **Dashboard**: Interactive charts and analytics
- 📋 **Task Management**: Track learning progress
- 💬 **AI Chat Interface**: Interactive learning assistant
- 🎯 **Goal Setup**: Personalized learning paths
- 🛣️ **Roadmap Visualization**: Track your learning journey
- 📚 **Learning Dashboard**: Central hub for all learning activities

### Backend Features:

- 🔐 **User Authentication**: Secure JWT-based authentication
- 🗃️ **MongoDB Integration**: Database operations with Mongoose
- 🔄 **RESTful API**: Well-structured API endpoints
- 🛡️ **Error Handling**: Comprehensive error handling middleware
- 📈 **Health Monitoring**: API health check endpoints
- 🌐 **CORS Support**: Secure cross-origin resource sharing

## 🔄 Development Workflow

1. **Make Changes**: Edit files in `client/src/` for frontend or `server/` for backend
2. **Hot Reload**: Changes automatically refresh in browser (frontend)
3. **Auto Restart**: Server automatically restarts on file changes (backend)
4. **Test API**: Use http://localhost:5000/api/health to test backend
5. **Build**: Run `npm run build` in client directory when ready for production

## 📦 Production Deployment

### Build for Production

```bash
# Build frontend
cd client
npm run build
```

The production build will be created in the `client/dist/` folder and served by the Express server.

### Start Production Server

```bash
# From server directory
npm start
```

## 🔧 Troubleshooting

### Port Already in Use

If you get a port error, you can:

1. Change the port in `.env` file
2. Kill the process using the port:

   ```bash
   # On Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID_NUMBER> /F

   # On Mac/Linux
   lsof -ti:5173 | xargs kill -9
   ```

### Dependencies Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Issues

```bash
# Clear build cache
rm -rf dist
npm run build
```

## 🛡️ Security Notes

- Always change JWT_SECRET in production
- Use strong, unique passwords
- Enable MongoDB authentication in production
- Use HTTPS in production
- Validate and sanitize all user inputs

## 📚 API Documentation

The API follows REST conventions with the following main endpoints:

- `GET /api/health` - Health check endpoint
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/user/profile` - Get user profile
- `POST /api/goals` - Create learning goals
- `GET /api/roadmap` - Get learning roadmap
- `GET /api/tasks` - Get learning tasks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check Node.js version: `node --version` (should be 16+)
2. Check npm version: `npm --version`
3. Verify all files are present: Ensure package.json exists
4. Check console for errors: Open browser dev tools (F12)
5. Restart the development server: Stop (Ctrl+C) and run dev commands again

## 🎉 You're Ready!

Your Infinite Learning Platform should now be running locally with all features working:

- Beautiful responsive UI
- Interactive dashboard
- Task management system
- AI chat functionality
- Success stories
- Goal selection
- Personalized learning paths

Happy coding! 🚀
