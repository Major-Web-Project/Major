import express from 'express';
import Task from '../models/Task.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test endpoint to create a task with sample resources
router.post('/create-test-task', protect, async (req, res) => {
  try {
    const testTask = new Task({
      user: req.user._id,
      goal: req.body.goalId, // You'll need to provide a valid goal ID
      title: "Test Task with Resources",
      description: "This is a test task to verify resource display functionality",
      type: "learning",
      category: "Testing",
      difficulty: 3,
      priority: "medium",
      estimatedTime: 1,
      status: "pending",
      isAIGenerated: true,
      topics: ["React", "JavaScript", "Testing"],
      resources: [
        {
          type: "documentation",
          title: "React Official Documentation",
          url: "https://reactjs.org/docs/getting-started.html"
        },
        {
          type: "video",
          title: "React Tutorial for Beginners",
          url: "https://www.youtube.com/watch?v=Ke90Tje7VS0"
        },
        {
          type: "article",
          title: "Modern React Best Practices",
          url: "https://blog.logrocket.com/modern-react-best-practices/"
        }
      ],
      realWorldApplication: "Building modern web applications with React",
      successCriteria: [
        "Understand React components",
        "Create a simple React app",
        "Use React hooks effectively"
      ],
      scheduledDate: new Date(),
      phase: 1,
      dayNumber: 1
    });

    await testTask.save();
    
    res.json({
      success: true,
      message: "Test task created successfully",
      task: testTask.formattedData
    });
  } catch (error) {
    console.error('Error creating test task:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create test task",
      error: error.message
    });
  }
});

export default router;