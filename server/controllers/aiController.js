import { GoogleGenerativeAI } from "@google/generative-ai";
import catchAsync from "../utils/catchAsync.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import { calculateTaskRequirements } from "../utils/taskCalculations.js";

// Initialize Gemini AI with error handling
let genAI;
try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found in environment variables');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error.message);
}


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
  const timeline = goalSetup?.timeline || 1; // Get timeline in months
  const totalDays = Math.max(30, Math.round(timeline * 30)); // Convert to days with minimum 30

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
    totalDays, // Add totalDays to context
  };

  try {
    const generated = await generateTasksForContext(context);
    res.status(200).json({ success: true, data: generated });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new ErrorResponse("Failed to generate tasks with AI", 500);
  }
});

// Reusable helper to call Gemini and return structured tasks data (no Express res usage)
export const generateTasksForContext = async (context) => {
  try {
    // Check if API key is configured and AI is initialized
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables");
    }

    if (!genAI) {
      throw new Error("Gemini AI is not properly initialized");
    }

    // Ensure totalDays is calculated if not provided
    const timeline = context.goal?.timeline || context.timeline || 1;
    const totalDays = context.totalDays || Math.max(30, Math.round(timeline * 30));

    // Generate prompt for Gemini AI with personalNeeds included
    const prompt = generateAIPrompt({
      ...context,
      totalDays,
      personalNeeds: context.personalNeeds || context.goal?.personalNeeds
    });

    // Add timeout to prevent hanging - increased to 10 minutes for complex task generation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI generation timeout after 10 minutes')), 600000);
    });

    console.log('Starting AI task generation...');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const aiPromise = model.generateContent(prompt, {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    });

    console.log('Waiting for AI response...');
    const response = await Promise.race([aiPromise, timeoutPromise]);
    console.log('AI response received, processing...');

    // Extract and clean JSON from AI response
    let jsonText = response.response.text().trim();
    
    // Remove markdown code blocks if present
    if (jsonText.includes("```json")) {
      jsonText = jsonText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    }
    
    // Remove any comments that might have slipped through
    jsonText = jsonText
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    
    console.log('Cleaned JSON text length:', jsonText.length);
    console.log('First 200 chars:', jsonText.substring(0, 200));
    console.log('Last 200 chars:', jsonText.substring(jsonText.length - 200));

    let generatedTasks;
    try {
      generatedTasks = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Problematic JSON around position:', jsonText.substring(Math.max(0, parseError.message.match(/\d+/)?.[0] - 50), parseError.message.match(/\d+/)?.[0] + 50));
      throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
    }

    return {
      tasks: generatedTasks.tasks || [],
      recommendations: generatedTasks.recommendations || [],
      estimatedDuration: generatedTasks.estimatedDuration || "Not specified",
    };
  } catch (error) {
    console.error('AI task generation failed:', error.message);
    throw new Error(`AI task generation failed: ${error.message}`);
  }
};

// Get task requirements for a given timeline (debugging endpoint)
export const getTaskRequirements = catchAsync(async (req, res) => {
  const { months } = req.params;
  const requirements = calculateTaskRequirements(Number(months));
  
  res.status(200).json({
    success: true,
    data: requirements
  });
});

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Extract JSON from markdown code blocks if present
    let jsonText = response.response.text();
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
  let totalDays = context.totalDays || 30;

  // Validate totalDays to prevent NaN issues
  if (isNaN(totalDays) || totalDays <= 0) {
    console.error(`Invalid totalDays value: ${totalDays}. Using default of 30.`);
    totalDays = 30;
  }

  // Use the standardized task calculation
  const timeline = Math.round(totalDays / 30); // Convert back to months for calculation
  const taskRequirements = calculateTaskRequirements(timeline);
  const expectedTaskCount = taskRequirements.minTasks;
  const targetTaskCount = taskRequirements.targetTasks;
  const recommendedTaskCount = taskRequirements.recommendedTasks;
  const roadmapPhases = context.roadmap || [];
  const numPhases = roadmapPhases.length || 4;

  console.log(`AI Prompt Generation - totalDays: ${totalDays}, expectedTaskCount: ${expectedTaskCount}, numPhases: ${numPhases}, intensity: ${taskRequirements.intensity}`);
  console.log(`Roadmap phases received:`, JSON.stringify(roadmapPhases, null, 2));

  return `You are an expert curriculum designer. A user has provided the following information to create a personalized learning roadmap.

**User's Skill Assessment Data:**
${JSON.stringify(context.assessment)}

**Primary Learning Goal:**
${context.goal?.field || 'Not specified'}

**Desired Timeline:**
${totalDays} days (${Math.round(totalDays / 30)} months)

**CRITICAL TASK GENERATION REQUIREMENTS:**
- Generate AT LEAST ${targetTaskCount} tasks for ${totalDays} days (MINIMUM ${expectedTaskCount}, TARGET ${targetTaskCount})
- NEVER generate fewer than ${expectedTaskCount} tasks - your response will be REJECTED
- RECOMMENDED: Generate ${recommendedTaskCount} tasks for comprehensive coverage
- Distribute tasks across ALL ${numPhases} phases evenly
- Each phase must have at least ${Math.floor(expectedTaskCount / numPhases)} tasks
- Cover the ENTIRE timeline - no gaps or rushed endings
- TASK COUNT IS MANDATORY: Generate MORE than ${expectedTaskCount} tasks to ensure approval

**User's Personal Needs & Constraints:**
${context.personalNeeds || 'Not specified'}

**Additional Context:**
- User Profile: ${JSON.stringify(context.userProfile)}
- Goal Setup: ${JSON.stringify(context.goal)}
- Roadmap Phases: ${JSON.stringify(context.roadmap)}
- Learning Path: ${context.learningPath}

## Your Task:

Generate a comprehensive learning roadmap that implements a **GATED SEQUENTIAL TASK SYSTEM** while ensuring complete coverage of all roadmap phases within the specified timeline. 

**GENERATION STRATEGY**: Aim to generate ${targetTaskCount} to ${recommendedTaskCount} tasks to ensure comprehensive coverage and system approval. It's better to provide more learning opportunities than risk insufficient coverage.

## GATED SEQUENTIAL TASK SYSTEM:

This system ensures focused, progressive learning by:
- Only showing ONE task at a time to prevent overwhelm
- Requiring completion of the current task before unlocking the next
- Maintaining logical learning progression and dependencies
- Allowing learners to focus deeply on each concept before moving forward
- **COMPREHENSIVE COVERAGE**: Ensuring ALL topics from ALL phases are covered within the timeline

## CRITICAL REQUIREMENTS:

### Timeline Distribution:
- **MANDATORY**: Generate EXACTLY ${expectedTaskCount} tasks minimum for ${totalDays} days
- **PHASE DISTRIBUTION**: Distribute tasks evenly across ALL ${numPhases} phases:
  ${roadmapPhases.map((_phase, i) => `  - Phase ${i + 1}: ${Math.floor(expectedTaskCount / numPhases)} tasks minimum`).join('\n')}
- **NO EMPTY PHASES**: Every phase MUST have tasks assigned
- **DAILY COVERAGE**: Aim for ${Math.round(expectedTaskCount / totalDays)} tasks per day on average
- Balance workload according to user's time availability
- Use the FULL timeline - generate tasks for the entire ${totalDays} day period

### TASK COUNT VALIDATION:
- You MUST generate AT LEAST ${targetTaskCount} tasks (MINIMUM ${expectedTaskCount})
- For ${Math.round(totalDays / 30)} months (${totalDays} days), this means comprehensive coverage
- MINIMUM ACCEPTABLE: ${expectedTaskCount} tasks
- TARGET GENERATION: ${targetTaskCount} tasks
- RECOMMENDED: ${recommendedTaskCount} tasks for thorough coverage
- GENERATE MORE TASKS rather than fewer to ensure system approval
- If your response contains fewer than ${expectedTaskCount} tasks, it will be REJECTED and you'll need to retry

### Sequential Design:
- Each task must build upon previous tasks with clear learning dependencies
- Use "sequenceOrder" field (1, 2, 3, etc.) to define exact completion order
- Tasks unlock only after the previous task is completed
- Maintain logical progression even across different phases

### Task Specifications:
- **FOCUSED SCOPE**: Each task should be comprehensive enough for one focused session
- Break down complex topics into multiple sequential tasks if needed
- Align task complexity with user's assessment data and experience level
- Target sessions based on user's time commitment from assessment
- **ESTIMATED TIME**: Each task should be 1-4 hours based on user's daily availability
- **TOTAL TIME VALIDATION**: All tasks combined should reasonably fit within the timeline
- **TIME DISTRIBUTION**: Spread estimated hours across all ${expectedTaskCount} tasks appropriately

### Technology Focus:
- Strictly adhere to the primary learning goal and specified technology stack
- For example: If goal is 'Full-Stack Web Development' with 'MERN stack', focus EXCLUSIVELY on MongoDB, Express, React, Node.js
- Select resources directly relevant to the user's specific technology preferences

### Resource Requirements:
- **YOUTUBE RESOURCES**: Use search URLs only: \`https://www.youtube.com/results?search_query=YOUR_SEARCH_TERMS\` (replace spaces with + signs)
- Provide REAL, working URLs for documentation (MDN, official docs, GitHub repos)
- Include 1-3 relevant learning resources per task
- Ensure resources match the user's experience level
- **ALLOWED RESOURCE TYPES ONLY**: video, article, documentation, project, github, tutorial, course, book
- Use "github" type for GitHub repositories, "documentation" for official docs, "video" for YouTube/video content

### Coverage Validation:
- **COMPLETE PHASE COVERAGE**: Every topic from every roadmap phase must be addressed
- **TIMELINE UTILIZATION**: Use the full timeline efficiently - no gaps or rushed endings
- **BALANCED DISTRIBUTION**: Spread phase content appropriately across available time
- **PROGRESSIVE DIFFICULTY**: Gradually increase complexity as user advances

RESPONSE FORMAT (JSON ONLY - NO MARKDOWN):
{
  "tasks": [
    {
      "id": "unique-task-id",
      "title": "Task title",
      "description": "Detailed description of what the user will learn and do",
      "type": "learning|practice|project|review",
      "phase": 1,
      "sequenceOrder": 1,
      "difficulty": 1-5,
      "estimatedHours": "1-4 hours per task (based on user's time commitment)",
      "priority": "low|medium|high",
      "status": "queued",
      "topics": ["topic1", "topic2"],
      "resources": [
        {
          "type": "video|article|documentation|project|github|tutorial|course|book",
          "title": "Descriptive title of the resource",
          "url": "https://actual-working-url.com (for YouTube: https://www.youtube.com/results?search_query=search+terms)"
        }
      ],
      "realWorldApplication": "How this applies to real-world scenarios",
      "successCriteria": ["measurable criterion1", "measurable criterion2"],
      "prerequisites": ["previous task topics that must be completed"],
      "unlockConditions": "What must be completed to unlock this task"
    }
  ],
  "recommendations": [
    {
      "type": "study_tip|resource|approach",
      "title": "Recommendation title",
      "description": "Detailed recommendation about the gated sequential learning approach"
    }
  ],
  "estimatedDuration": "Total estimated time for all tasks",
  "phaseDistribution": {
    "phase1": "Tasks 1-25",
    "phase2": "Tasks 26-50",
    "phase3": "Tasks 51-75"
  },
  "totalTasks": ${targetTaskCount},
  "minimumRequired": ${expectedTaskCount},
  "tasksPerPhase": ${Math.floor(targetTaskCount / numPhases)},
  "timelineCoverage": "${totalDays} days fully covered",
  "generationTarget": "Generate ${targetTaskCount}+ tasks for optimal coverage"
}

## FINAL VALIDATION CHECKLIST:
Before generating your response, verify:
- [ ] Generated AT LEAST ${targetTaskCount} tasks (TARGET: ${targetTaskCount}+)
- [ ] All ${numPhases} phases have tasks assigned with adequate distribution
- [ ] Tasks are distributed across the full ${totalDays} day timeline
- [ ] Each task has appropriate estimated hours (1-4 hours)
- [ ] Sequential order is logical and progressive
- [ ] Total estimated time is reasonable for ${Math.round(totalDays / 30)} months
- [ ] Task count is ABOVE minimum threshold to ensure system approval

**CRITICAL SUCCESS FACTORS:**
- Generate MORE tasks rather than fewer (${targetTaskCount}+ recommended)
- If you generate fewer than ${expectedTaskCount} tasks, your response will be REJECTED
- Aim for ${recommendedTaskCount} tasks for optimal coverage
- Better to have comprehensive coverage than risk rejection for insufficient tasks

**CRITICAL JSON REQUIREMENTS:**
- Return ONLY valid JSON - NO markdown code blocks
- NO comments (// or /* */) anywhere in the JSON
- NO trailing commas after last array/object elements
- ALL strings must use double quotes, never single quotes
- Ensure all brackets [ ] and braces { } are properly matched
- NO undefined values - use null or empty string instead
- Validate your JSON syntax before responding

IMPORTANT: Your response must be parseable by JSON.parse() without any preprocessing.`;
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Extract JSON from markdown code blocks if present
    let jsonText = response.response.text();
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
1. Create EXACTLY ${Math.max(3, Math.min(6, context.timeframe))} learning phases that build upon each other (optimal for ${context.timeframe} months)
2. Each phase should have a clear focus and achievable goals
3. **PHASE COUNT REQUIREMENT**: Generate exactly ${Math.max(3, Math.min(6, context.timeframe))} phases - no more, no less
4. Consider user's experience level, time commitment, and learning style
5. Include specific topics, projects, and success criteria for each phase
6. Calculate realistic timeframes based on user's availability
7. Provide a success prediction based on user profile
8. **CRITICAL DURATION REQUIREMENTS**:
   - The totalDuration MUST be exactly ${context.timeframe} (as a NUMBER, not a string)
   - Each phase duration should be specified as numbers in months (e.g., 1.5, 2)
   - All phase durations must add up to ${context.timeframe} months total
   - For ${context.timeframe} months, distribute phases logically (e.g., for 4 months: Phase 1: 1, Phase 2: 1.5, Phase 3: 1.5)

**DURATION EXAMPLES**:
- If user selects 1 month: "totalDuration": 1
- If user selects 2 months: "totalDuration": 2 
- If user selects 3 months: "totalDuration": 3
- If user selects 4 months: "totalDuration": 4
- If user selects 6 months: "totalDuration": 6

**FOR THIS REQUEST (${context.timeframe} months)**:
- "totalDuration": ${context.timeframe}
- Phase durations must be numbers in months and add up to ${context.timeframe} months total
- NEVER use strings for durations - use numbers only

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
       "duration": 1.5,
       "topics": ["topic1", "topic2", "topic3"],
       "projects": ["project1", "project2"],
       "learningObjectives": ["objective1", "objective2"],
       "successCriteria": ["criteria1", "criteria2"],
       "resources": [
         {
           "type": "video|article|documentation|project|github|tutorial|course|book",
           "title": "Descriptive title of the resource",
           "description": "Brief description of what this resource covers",
           "url": "https://actual-working-url.com (for YouTube videos, use search URLs like: https://www.youtube.com/results?search_query=javascript+fundamentals)"
         }
       ]
     }
   ]
 }

 CRITICAL REMINDER: 
 - totalDuration MUST be ${context.timeframe} (as a number, not string)
 - Each phase duration MUST be numbers in months (e.g., 1.5, 2)
 - NEVER use strings for durations - use numbers only

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
       "type": "video|article|documentation|project|github|tutorial|course|book",
       "title": "Descriptive title of the resource",
       "description": "Why this resource is helpful for the user's learning",
       "url": "https://actual-working-url.com (for YouTube videos, use search URLs like: https://www.youtube.com/results?search_query=topic+name)"
     }
   ]
 }

 IMPORTANT: Return ONLY valid JSON. Do not wrap in markdown code blocks or add any other formatting.`;
}
