import { GoogleGenAI } from "@google/genai";
import catchAsync from "../utils/catchAsync.js";
import ErrorResponse from "../utils/ErrorResponse.js";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Generate real-world tasks using Gemini AI
export const generateTasksWithAI = catchAsync(async (req, res) => {
  const {
    assessmentData,
    goalSetup,
    roadmapSteps,
    currentPhase,
    userProfile,
    learningPath,
  } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    throw new ErrorResponse(
      "Gemini AI is not configured. Please contact support to enable AI-powered task generation.",
      500
    );
  }

  // Create context for Gemini AI
  const context = {
    userProfile: {
      experienceLevel: userProfile?.experienceLevel || 2,
      timeCommitment: userProfile?.timeCommitment || 3,
      learningStyle: userProfile?.preferredStyle || "balanced",
      motivation: userProfile?.motivation || 3,
    },
    assessment: assessmentData,
    goal: goalSetup,
    roadmap: roadmapSteps,
    currentPhase,
    currentDay: 1,
    learningPath,
  };

  try {
    const generated = await generateTasksForContext(context);
    console.log(generated);
    res.status(200).json({ success: true, data: generated });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new ErrorResponse("Failed to generate tasks with AI", 500);
  }
});

// Reusable helper to call Gemini and return structured tasks data (no Express res usage)
export const generateTasksForContext = async (context) => {
  // Generate prompt for Gemini AI with personalNeeds included
  const prompt = generateAIPrompt({
    ...context,
    personalNeeds: context.personalNeeds || context.goal?.personalNeeds
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  // Extract JSON from markdown code blocks if present
  let jsonText = response.text;
  if (jsonText.includes("```json")) {
    jsonText = jsonText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
  }

  const generatedTasks = JSON.parse(jsonText);
  return {
    tasks: generatedTasks.tasks,
    recommendations: generatedTasks.recommendations,
    estimatedDuration: generatedTasks.estimatedDuration,
  };
};

// Generate personalized learning recommendations
export const generateLearningRecommendations = catchAsync(async (req, res) => {
  const { userProfile, progressData, currentTasks } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    throw new ErrorResponse(
      "Gemini AI is not configured. Please contact support to enable AI-powered recommendations.",
      500
    );
  }

  const prompt = generateRecommendationsPrompt(
    userProfile,
    progressData,
    currentTasks
  );

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Extract JSON from markdown code blocks if present
    let jsonText = response.text;
    if (jsonText.includes("```json")) {
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    }

    const recommendations = JSON.parse(jsonText);

    res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new ErrorResponse("Failed to generate recommendations", 500);
  }
});

// Helper function to generate AI prompt for task generation
function generateAIPrompt(context) {
  // New prompt: generate tasks for the entire timeline, distributed by phase and day
  return `You are an expert curriculum designer. A user has provided the following information to create a personalized learning roadmap.

**User's Skill Assessment Data:**
${JSON.stringify(context.assessment)}

**Primary Learning Goal:**
${context.goal?.field || 'Not specified'}

**Desired Timeline:**
${context.totalDays ? `${context.totalDays} days` : 'Not specified'}

**User's Personal Needs & Constraints:**
${context.personalNeeds || 'Not specified'}

**Additional Context:**
- User Profile: ${JSON.stringify(context.userProfile)}
- Goal Setup: ${JSON.stringify(context.goal)}
- Roadmap Phases: ${JSON.stringify(context.roadmap)}
- Learning Path: ${context.learningPath}

**Your Task:**
Based on all the provided information, generate a detailed, phase-by-phase learning roadmap. For each phase, create a list of specific, actionable tasks.

**CRITICAL REQUIREMENTS:**
- Use the assessment data to gauge the user's starting proficiency and adjust the complexity and pace of the initial tasks.
- Strictly adhere to the primary learning goal. For example, if the goal is 'Full-Stack Web Development' and personal needs specify 'MERN stack, 2 hours/day evenings', you MUST focus exclusively on MERN (MongoDB, Express, React, Node.js) technologies.
- Break down tasks into smaller, manageable units that can be completed in short sessions (approx. 2 hours), accommodating the user's time availability.
- Select learning resources (articles, videos, projects) that are directly relevant to the user's specific technology stack and preferences.
- For resources, provide REAL, working URLs to actual learning materials (MDN docs, official documentation, YouTube tutorials, GitHub repos, etc.).
- The entire plan must be realistically achievable within the specified timeline.
- For EACH DAY in the timeline (from Day 1 to Day N), generate 1-3 practical, real-world tasks, distributed across the roadmap phases according to their duration.
- Each task must be specific, actionable, and clearly aligned with ONE of the roadmap phases.
- Include which phase the task belongs to using the numeric field "phase", referencing the provided roadmap phases.
- Include the day number (1-based) for each task using the field "dayNumber".
- Consider user's experience level and time commitment.
- Include estimated duration (in hours).
- Provide difficulty level (1-5).
- Include learning resources and tips.
- IMPORTANT: For each task, include 1-3 relevant learning resources with REAL URLs:
  * Official documentation (MDN, React docs, etc.)
  * High-quality tutorials (freeCodeCamp, YouTube channels like Traversy Media, etc.)
  * Interactive learning platforms (Codecademy, Khan Academy, etc.)
  * GitHub repositories with examples
  * Ensure URLs are actual working links, not placeholders

RESPONSE FORMAT (JSON ONLY - NO MARKDOWN):
{
  "tasks": [
    {
      "id": "unique-task-id",
      "title": "Task title",
      "description": "Detailed description",
      "type": "learning|practice|project|review",
      "phase": 1,
      "dayNumber": 1,
      "difficulty": 1-5,
      "estimatedHours": 1-8,
      "priority": "low|medium|high",
      "topics": ["topic1", "topic2"],
      "resources": [
        {
          "type": "video|article|documentation|project",
          "title": "Descriptive title of the resource",
          "url": "https://actual-working-url.com"
        }
      ],
      "realWorldApplication": "How this applies to real-world scenarios",
      "successCriteria": ["criterion1", "criterion2"]
    }
  ],
  "recommendations": [
    {
      "type": "study_tip|resource|approach",
      "title": "Recommendation title",
      "description": "Detailed recommendation"
    }
  ],
  "estimatedDuration": "Total estimated time for all tasks"
}

IMPORTANT: Return ONLY valid JSON. Do not wrap in markdown code blocks or add any other formatting.`;
}

// Generate personalized roadmap with AI
export const generateRoadmapWithAI = catchAsync(async (req, res) => {
  const { userProfile, learningPath, timeframe, customGoal, motivation } =
    req.body;

  if (!process.env.GEMINI_API_KEY) {
    throw new ErrorResponse(
      "Gemini AI is not configured. Please contact support to enable AI-powered roadmap generation.",
      500
    );
  }

  const context = {
    userProfile,
    learningPath,
    timeframe,
    customGoal,
    motivation,
  };

  const prompt = generateRoadmapPrompt(context);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Extract JSON from markdown code blocks if present
    let jsonText = response.text;
    if (jsonText.includes("```json")) {
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    }

    const generatedRoadmap = JSON.parse(jsonText);

    res.status(200).json({
      success: true,
      data: generatedRoadmap,
    });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new ErrorResponse("Failed to generate roadmap with AI", 500);
  }
});

// Helper function to generate roadmap prompt
function generateRoadmapPrompt(context) {
  return `You are an expert learning path designer. Generate a personalized learning roadmap based on the following context:

CONTEXT:
- User Profile: ${JSON.stringify(context.userProfile)}
- Learning Path: ${context.learningPath}
- Timeframe: ${context.timeframe} months
- Custom Goal: ${context.customGoal || "Not specified"}
- Motivation: ${context.motivation || "Not specified"}

REQUIREMENTS:
1. Create 3-5 learning phases that build upon each other
2. Each phase should have a clear focus and achievable goals
3. Consider user's experience level, time commitment, and learning style
4. Include specific topics, projects, and success criteria for each phase
5. Calculate realistic timeframes based on user's availability
6. Provide a success prediction based on user profile

 RESPONSE FORMAT (JSON ONLY - NO MARKDOWN):
 {
   "title": "Roadmap title",
   "description": "Brief description of the learning journey",
   "totalDuration": ${context.timeframe},
   "successPrediction": 0.85,
   "personalizedSchedule": {
     "dailyHours": 3,
     "sessionsPerDay": 2,
     "breakIntervals": 45,
     "weeklyStructure": {
       "studyDays": 5,
       "restDays": 2
     }
   },
   "phases": [
     {
       "phase": 1,
       "title": "Phase title",
       "description": "Phase description",
       "duration": 2.5,
       "topics": ["topic1", "topic2", "topic3"],
       "projects": ["project1", "project2"],
       "learningObjectives": ["objective1", "objective2"],
       "successCriteria": ["criteria1", "criteria2"],
       "resources": [
         {
           "type": "video|article|documentation|project",
           "title": "Descriptive title of the resource",
           "description": "Brief description of what this resource covers",
           "url": "https://actual-working-url.com"
         }
       ]
     }
   ]
 }

 IMPORTANT: Return ONLY valid JSON. Do not wrap in markdown code blocks or add any other formatting.`;
}

// Helper function to generate recommendations prompt
function generateRecommendationsPrompt(
  userProfile,
  progressData,
  currentTasks
) {
  return `You are an expert learning coach. Generate personalized learning recommendations based on:

CONTEXT:
- User Profile: ${JSON.stringify(userProfile)}
- Progress Data: ${JSON.stringify(progressData)}
- Current Tasks: ${JSON.stringify(currentTasks)}

REQUIREMENTS:
1. Analyze user's progress and identify areas for improvement
2. Provide specific, actionable recommendations
3. Consider learning style and time constraints
4. Suggest resources and study techniques
5. Include motivation and encouragement

 RESPONSE FORMAT (JSON ONLY - NO MARKDOWN):
 {
   "improvementAreas": [
     {
       "area": "area name",
       "description": "why this needs improvement",
       "suggestions": ["suggestion1", "suggestion2"]
     }
   ],
   "studyTips": [
     {
       "tip": "tip title",
       "description": "detailed tip",
       "applicableTo": "when to use this tip"
     }
   ],
   "motivation": {
     "message": "encouraging message",
     "nextSteps": ["step1", "step2"]
   },
   "resources": [
     {
       "type": "video|article|documentation|project",
       "title": "Descriptive title of the resource",
       "description": "Why this resource is helpful for the user's learning",
       "url": "https://actual-working-url.com"
     }
   ]
 }

 IMPORTANT: Return ONLY valid JSON. Do not wrap in markdown code blocks or add any other formatting.`;
}
