// --- STREAMING PROGRESS SSE ENDPOINTS ---
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import catchAsync from "../utils/catchAsync.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import Goal from "../models/Goal.js";
import TaskGenerationProcess from "../models/TaskGenerationProcess.js";
import { jsonrepair } from "jsonrepair";
// ...other imports as needed...
const router = express.Router();

// SSE endpoint for streaming roadmap generation progress
router.get("/roadmap/stream", async (req, res) => {
  console.log("[SSE] /roadmap/stream request received", req.query);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  function send(stage, percent, extra = {}) {
    console.log(
      `[SSE] Sending event: stage=${stage}, percent=${percent}, extra=${JSON.stringify(
        extra
      )}`
    );
    res.write(`data: ${JSON.stringify({ stage, percent, ...extra })}\n\n`);
  }
  try {
    send("Analyzing your learning style", 10);
    // Parse input context from query or body (for GET, use query)
    const context = req.query || {};
    // You may want to parse JSON if sent as a string
    if (typeof context.answers === "string") {
      try {
        context.answers = JSON.parse(context.answers);
      } catch {}
    }
    if (typeof context.personalize === "string") {
      try {
        context.personalize = JSON.parse(context.personalize);
      } catch {}
    }
    send("Designing learning phases", 30);
    // Prepare the prompt
    const roadmapPrompt = generateRoadmapPrompt({
      answers: context.answers || [],
      personalize: context.personalize || "",
      duration: context.duration || 3,
      path: context.path || "",
    });
    send("Generating personalized roadmap", 60);
    // Use Gemini streaming API
    const roadmapModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You must respond ONLY with valid, strict JSON. Do not include any markdown, comments, or extra text. The JSON must be parseable and must not contain trailing commas, missing brackets, or syntax errors. If you cannot generate valid JSON, regenerate your output until it is valid.",
    });
    const stream = await roadmapModel.generateContentStream(roadmapPrompt);
    let aiText = "";
    let percent = 65;
    for await (const chunk of stream.stream) {
      if (chunk && chunk.text) {
        const chunkText = chunk.text();
        console.log("[SSE] [ROADMAP] AI chunk:", chunkText);
        aiText += chunkText;
        percent = Math.min(percent + 5, 95);
        send("AI generating...", percent, { partial: aiText.slice(-200) });
      }
    }
    // Removed file logging of raw AI output; proceed to parse directly
    // Try to extract the JSON from the AI output
    const firstBrace = aiText.indexOf("{");
    const lastBrace = aiText.lastIndexOf("}");
    let roadmapJson = null;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const aiRawJson = aiText.substring(firstBrace, lastBrace + 1);
      console.log("[AIController] Raw AI roadmap response:", aiRawJson);
      const cleaned = cleanJsonText(aiRawJson);
      console.log("[AIController] Cleaned AI roadmap JSON:", cleaned);
      try {
        roadmapJson = JSON.parse(cleaned);
        // Log the full AI roadmap JSON being saved
        console.log(
          "[AIController] Final roadmap JSON to save:",
          JSON.stringify(roadmapJson, null, 2)
        );
      } catch (e) {
        console.error(
          "[AIController] Failed to parse cleaned roadmap JSON:",
          cleaned,
          e
        );
        send("Error", 100, {
          error: "Failed to parse AI JSON.",
        });
        res.end();
        return;
      }
    }
    // Save roadmap to DB: always create a new goal for new ideas
    let savedGoal = null;
    try {
      const userId = context.userId;
      // Ensure 'field' is set: if empty, use 'path'
      let field = context.field;
      if (!field || field === "") {
        field = context.path || "";
      }
      const goalData = {
        user: userId,
        field,
        path: context.path || "",
        description: context.description || "AI-generated goal",
        timeline: context.duration || 3,
        roadmap: roadmapJson,
        userProfile: context.personalize || {},
        assessmentData: context.answers || {},
      };
      try {
        savedGoal = await Goal.create(goalData);
        console.log("[AIController] Goal saved with roadmap:", {
          goalId: savedGoal?._id,
          roadmap: savedGoal?.roadmap,
        });
      } catch (dbErr) {
        console.error(
          "[AIController] MongoDB error while saving Goal:",
          dbErr,
          goalData
        );
        send("Complete", 100, {
          roadmap: roadmapJson,
          error: `MongoDB error: ${dbErr.message}`,
        });
        res.end();
        return;
      }
      send("Complete", 100, { roadmap: roadmapJson, goalId: savedGoal?._id });
    } catch (err) {
      console.error("[AIController] Unexpected error in roadmap save:", err);
      send("Complete", 100, {
        roadmap: roadmapJson,
        error: `Unexpected error: ${err.message}`,
      });
    }
    res.end();
  } catch (err) {
    send("Error", 100, { error: err.message });
    res.end();
  }
});

// SSE endpoint for streaming task generation progress

// (Deprecated legacy task streaming endpoint removed)

// GET SSE endpoint for per-phase task generation (smaller prompts, more reliable)

router.get("/tasks/stream-phases", async (req, res) => {
  console.log("[SSE] /tasks/stream-phases request received", req.query);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const send = (stage, percent, extra = {}) => {
    const payload = { stage, percent, ...extra };
    const logExtra = (() => {
      try {
        const s = JSON.stringify(extra);
        return s.length > 300 ? s.slice(0, 300) + "…" : s;
      } catch {
        return String(extra);
      }
    })();
    console.log(
      `[SSE] [TASKS-PHASES] Sending event: stage=${stage}, percent=${percent}, extra=${logExtra}`
    );
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  let processDoc = null;
  try {
    // Minimal inputs expected: userId, goalId
    const { userId, goalId } = req.query || {};
    if (!userId || !goalId) {
      send("Error", 100, { error: "Missing userId or goalId." });
      return res.end();
    }

    // Create TaskGenerationProcess document (status: pending)
    processDoc = await TaskGenerationProcess.create({
      userId,
      goalId,
      status: "pending",
      startedAt: new Date(),
    });

    send("Fetching goal and roadmap", 5);
    const GoalModel = (await import("../models/Goal.js")).default;
    const TaskModel = (await import("../models/Task.js")).default; // Import TaskModel once
    const goal = await GoalModel.findById(goalId);
    if (!goal) {
      send("Error", 100, { error: "Goal not found" });
      return res.end();
    }
    if (String(goal.user) !== String(userId)) {
      console.warn("[SSE] [TASKS-PHASES] Goal does not belong to user.");
      // Continue anyway to avoid leaking details, but prefer to stop in production
    }

    // Parse roadmap
    let roadmap = goal.roadmap;
    if (typeof roadmap === "string") {
      try {
        roadmap = JSON.parse(roadmap);
      } catch {}
    }
    if (
      !roadmap ||
      !Array.isArray(roadmap.phases) ||
      roadmap.phases.length === 0
    ) {
      send("Error", 100, { error: "Goal has no roadmap phases" });
      return res.end();
    }

    // Compute totalDays and per-phase min days
    let durationMonths = roadmap.totalDuration || 1;
    if (typeof durationMonths === "string") {
      const m = durationMonths.match(/([\d.]+)/);
      durationMonths = m ? parseFloat(m[1]) : 1;
    }
    const { calculateTaskRequirements } = await import(
      "../utils/taskCalculations.js"
    );
    const { totalDays } = calculateTaskRequirements(durationMonths);
    const phases = roadmap.phases;

    // Fetch assessment answers and personalization for richer context
    let personalize = goal.personalNeeds || goal.userProfile || "";
    let answers = [];
    try {
      const AssessmentAnswers = (await import("../models/AssessmentAnswers.js"))
        .default;
      const assessmentDoc = await AssessmentAnswers.findOne({ user: userId });
      if (assessmentDoc) {
        if (assessmentDoc.personalize) personalize = assessmentDoc.personalize;
        if (Array.isArray(assessmentDoc.answers))
          answers = assessmentDoc.answers;
      }
    } catch {}

    // Mark generation start
    try {
      goal.isGeneratingTasks = true;
      await goal.save();
      if (processDoc) {
        processDoc.status = "in_progress";
        await processDoc.save();
      }
    } catch {}

    // Prepare DB: idempotency cleanup before generation begins
    await TaskModel.deleteMany({ goal: goal._id });

    // Track created tasks and scheduling state
    const createdTasks = [];
    const startDate = new Date();
    const tasksPerDay = Math.max(
      2,
      Math.min(
        3,
        Number(
          roadmap.personalizedSchedule?.sessionsPerDay ||
            roadmap.studySessions ||
            2
        ) || 2
      )
    );
    let globalTaskIndex = 0;
    let phaseIndex = 0;
    for (const phase of phases) {
      phaseIndex += 1;
      const percentStart =
        Math.round(((phaseIndex - 1) / phases.length) * 80) + 10; // 10..90
      const percentEnd = Math.round((phaseIndex / phases.length) * 80) + 10;
      send(
        `Phase ${phase.phase || phaseIndex}: preparing prompt`,
        percentStart
      );

      const studySessions =
        roadmap.studySessions ||
        roadmap.personalizedSchedule?.sessionsPerDay ||
        2;
      const dailyCommitment =
        roadmap.dailyCommitment ||
        `${roadmap.personalizedSchedule?.dailyHours || 2}h/day`;
      const minDaysForPhase = Math.max(
        30,
        Math.round((Number(phase.duration) || 1) * 30)
      );

      // Build assessment Q&A strings for prompt
      const qaPairs = convertAnswersToStrings(answers || []);
      const qaString = qaPairs
        .map((qap) => `- ${qap.question}: ${qap.answer}`)
        .join("\n");

      const prompt = generatePhaseTaskPrompt({
        field: goal.path || goal.field || "",
        phase,
        phaseNumber: phase.phase || phaseIndex,
        studySessions,
        dailyCommitment,
        minDaysForPhase,
        personalize:
          typeof personalize === "string"
            ? personalize
            : JSON.stringify(personalize || {}),
        assessmentQA: qaString,
      });

      const taskModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction:
          "Always respond with strict JSON only. No markdown, no comments.",
      });

      send(`Phase ${phase.phase || phaseIndex}: generating`, percentStart + 5);
      const stream = await taskModel.generateContentStream(prompt);
      let aiText = "";
      let p = percentStart + 5;
      for await (const chunk of stream.stream) {
        if (chunk && chunk.text) {
          const t = chunk.text();
          console.log("[SSE] [TASKS-PHASES] AI chunk:", t);
          aiText += t;
          p = Math.min(p + 3, percentEnd - 2);
          send(`Phase ${phase.phase || phaseIndex}: AI generating...`, p, {
            partial: aiText.slice(-160),
          });
        }
      }

      // Removed per-phase raw file logging
      // Extract JSON
      const firstBrace = aiText.indexOf("{");
      const lastBrace = aiText.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        send("Error", 100, {
          error: `Failed to extract JSON for phase ${
            phase.phase || phaseIndex
          }.`,
        });
        return res.end();
      }
      const cleaned = cleanJsonText(
        aiText.substring(firstBrace, lastBrace + 1)
      );
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (e1) {
        // Try to auto-repair the JSON if parsing fails
        try {
          const repaired = jsonrepair(cleaned);
          parsed = JSON.parse(repaired);
          console.warn(
            "[SSE] [TASKS-PHASES] JSON auto-repaired for phase",
            phase.phase || phaseIndex
          );
        } catch (e2) {
          console.error(
            "[SSE] [TASKS-PHASES] JSON parse/repair error for phase:",
            cleaned,
            e1,
            e2
          );
          send("Error", 100, {
            error: `Phase ${
              phase.phase || phaseIndex
            } returned invalid JSON and could not be auto-repaired.`,
          });
          return res.end();
        }
      }
      const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
      send(
        `Phase ${phase.phase || phaseIndex}: parsed ${tasks.length} tasks`,
        percentEnd
      );

      // Persist this phase's tasks immediately
      const phaseNumber = Number(phase.phase) || phaseIndex;
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i] || {};
        const sequenceOrder = Number(t.sequenceOrder) || i + 1;
        const estimatedTime =
          parseFloat(String(t.estimatedTime).split(" ")[0]) || 1;
        // Determine submission type if provided
        let submissionType;
        try {
          const fmt = (t.submissionRequirements?.format || "")
            .toString()
            .toLowerCase();
          if (["pdf", "excel", "link", "text", "none"].includes(fmt))
            submissionType = fmt;
        } catch {}
        const dayOffset = Math.floor(globalTaskIndex / tasksPerDay);
        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(startDate.getDate() + dayOffset);
        // Normalize resources to match Task schema enum and structure
        const rawResources = Array.isArray(t.resources) ? t.resources : [];
        const allowedResourceTypes = new Set([
          "video",
          "article",
          "documentation",
          "project",
          "github",
          "tutorial",
          "course",
          "book",
          "tool",
          "other",
        ]);
        const normResources = rawResources
          .map((r) => ({
            type: (r?.type || "other").toString().toLowerCase(),
            title: r?.title || r?.name || "",
            url: r?.url || r?.link || "",
            description: r?.description || r?.desc || "",
          }))
          .map((r) => ({
            ...r,
            type: allowedResourceTypes.has(r.type) ? r.type : "other",
          }));

        const newTask = new TaskModel({
          user: userId,
          goal: goal._id,
          title: t.title || `Task ${globalTaskIndex + 1}`,
          description: t.description || "",
          type: ["learning", "practice", "project", "review"].includes(t.type)
            ? t.type
            : "learning",
          category:
            Array.isArray(t.topics) && t.topics[0] ? t.topics[0] : "General",
          difficulty: t.difficulty || 3,
          priority: t.priority || "medium",
          estimatedTime,
          isAIGenerated: true,
          topics: Array.isArray(t.topics) ? t.topics : [],
          resources: normResources,
          realWorldApplication: t.realWorldApplication || "",
          successCriteria: Array.isArray(t.successCriteria)
            ? t.successCriteria
            : [],
          scheduledDate,
          phase: phaseNumber,
          dayNumber: Number(t.dayNumber) || undefined,
          status: "queued",
          sequenceOrder,
          submissionType,
          data: {
            ...(t.data || {}),
            taskInstructions: t.taskInstructions || "",
            submissionRequirements: t.submissionRequirements || null,
          },
        });
        await newTask.save();
        createdTasks.push(newTask);
        globalTaskIndex += 1;
      }
    }

    if (createdTasks.length > 0) {
      const firstTask = createdTasks[0];
      firstTask.status = "pending";
      firstTask.assignedDate = new Date();
      await firstTask.save();
    }

    goal.tasksGenerated = createdTasks.length > 0;
    goal.totalTasksGenerated = createdTasks.length;
    goal.isGeneratingTasks = false;
    // Attach latest roadmap snapshot and task references for frontend
    try {
      const taskIds = createdTasks.map((t) => t._id);
      if (Array.isArray(taskIds) && taskIds.length) {
        // Store only ids if schema doesn't have explicit tasks array; keep compatibility via virtual
        goal.completedTaskIds = goal.completedTaskIds || [];
      }
      // If roadmap exists from earlier step, keep it; otherwise ensure object
      if (!goal.roadmap || typeof goal.roadmap !== "object") {
        goal.roadmap = {};
      }
    } catch {}
    await goal.save();

    // Final cleanup for incomplete goals (best-effort)
    try {
      const { cleanupIncompleteGoals } = await import("./goalController.js");
      await cleanupIncompleteGoals(userId);
    } catch (cleanupErr) {
      console.error("[SSE] [TASKS-PHASES] Cleanup failed:", cleanupErr);
    }

    // Mark process as completed
    if (processDoc) {
      processDoc.status = "completed";
      processDoc.completedAt = new Date();
      await processDoc.save();
    }

    send("Complete", 100, { tasksGenerated: createdTasks.length });
    res.end();
  } catch (err) {
    console.error("[SSE] [TASKS-PHASES] Error:", err);
    // Mark process as failed
    if (processDoc) {
      processDoc.status = "failed";
      processDoc.error = err.message || "Task streaming failed.";
      processDoc.completedAt = new Date();
      await processDoc.save();
    }
    try {
      send("Error", 100, { error: err.message || "Task streaming failed." });
    } catch {}
    res.end();
  }
});

// --- INITIALIZATION ---
let genAI;
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
} else {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// --- ASSESSMENT META ---
// Maps frontend answer indices to readable questions and labels for AI prompt
const assessmentMeta = [
  {
    question: "How do you prefer to learn new concepts?",
    options: [
      { value: "fast_overview", label: "Quick overview first, then deep dive" },
      { value: "step_by_step", label: "Step-by-step detailed approach" },
      { value: "hands_on", label: "Learn by doing and experimenting" },
      { value: "theory_first", label: "Understand theory before practice" },
    ],
  },
  {
    question: "What learning environment works best for you?",
    options: [
      { value: "structured", label: "Highly structured with clear milestones" },
      {
        value: "flexible",
        label: "Flexible schedule with self-paced learning",
      },
      { value: "interactive", label: "Interactive with lots of practice" },
      { value: "guided", label: "Guided with mentor support" },
    ],
  },
  {
    question: "What is your programming experience level?",
    options: [
      { value: "beginner", label: "Beginner (0-1 years)" },
      { value: "intermediate", label: "Intermediate (1-3 years)" },
      { value: "advanced", label: "Advanced (3-5 years)" },
      { value: "expert", label: "Expert (5+ years)" },
    ],
  },
  {
    question: "How comfortable are you with learning new technologies?",
    options: [
      { value: "need_support", label: "Need significant support" },
      { value: "somewhat", label: "Somewhat comfortable" },
      { value: "comfortable", label: "Comfortable with guidance" },
      { value: "very_comfortable", label: "Very comfortable, I love new tech" },
    ],
  },
  {
    question: "How many hours per day can you dedicate to learning?",
    options: [
      { value: "1_hour", label: "1-2 hours" },
      { value: "2_hours", label: "2-4 hours" },
      { value: "4_hours", label: "4-6 hours" },
      { value: "6_plus", label: "6+ hours" },
    ],
  },
  {
    question: "How consistent can you be with your learning schedule?",
    options: [
      { value: "flexible", label: "Flexible schedule, when possible" },
      {
        value: "somewhat_consistent",
        label: "Somewhat consistent, 3-4 days/week",
      },
      { value: "mostly_consistent", label: "Mostly consistent, 5-6 days/week" },
      { value: "very_consistent", label: "Very consistent, daily practice" },
    ],
  },
  {
    question: "What is your primary learning goal?",
    options: [
      { value: "personal_interest", label: "Personal interest and growth" },
      { value: "promotion", label: "Get promoted in current role" },
      { value: "skill_upgrade", label: "Upgrade current skills" },
      { value: "career_change", label: "Complete career change" },
    ],
  },
];

// Converts answer indices to question/label pairs for AI prompt
function convertAnswersToStrings(answers) {
  return answers.map((ans, idx) => {
    const meta = assessmentMeta[idx];
    if (!meta) return { question: `Question ${idx + 1}`, answer: "(Unknown)" };
    const opt = meta.options[ans];
    return {
      question: meta.question,
      answer: opt ? opt.label : "(Unknown)",
    };
  });
}

function cleanJsonText(jsonText) {
  return jsonText.replace(/```json\s*([\s\S]*?)```/i, "$1").trim();
}

function validateAndSanitizeTasksResponse(data) {
  try {
    if (!data || typeof data !== "object") throw new Error("Invalid object");
    if (!Array.isArray(data.tasks)) data.tasks = [];
    return data;
  } catch (error) {
    return {
      tasks: [],
      recommendations: [],
      estimatedDuration: "Not specified",
    };
  }
}

// --- AI PROMPT GENERATORS ---
function generateRoadmapPrompt(context) {
  const { answers, personalize, duration, path } = context;
  const months = duration;
  const qaPairs = convertAnswersToStrings(answers || []);
  const qaString = qaPairs
    .map((qap) => `- ${qap.question}: ${qap.answer}`)
    .join("\n");
  const personalizeString = personalize
    ? `\nUser personalization: ${personalize}`
    : "";
  const fieldString = typeof path === "string" ? path : "";
  return `You are a super smart expert learning path designer, curriculum architect, and mentor. Your task is to generate a personalized learning roadmap as a single, clean JSON object.

**USER ASSESSMENT DATA:**
${qaString}
${personalizeString}
User Chosen Field: ${fieldString}

**INSTRUCTIONS:**
1. Analyze the user's answers and personalize string to infer their level, time commitment, strengths, weaknesses, learning style, and goals. Make smart decisions based on the user's responses to each question. Do not rely on any backend-calculated variables—use only the information provided above.
2. The user's chosen field (above) is one of: "Data Structures (DSA)", "Full Stack Development", "Cloud Computing", "AIML". You must generate the roadmap and assign phases for this field only. Do NOT include topics from other fields.
3. For each phase, provide a detailed breakdown of topics, subtopics, and projects, progressing logically from basics to advanced, and matching the chosen field. Ensure all key points and skills relevant to the field are covered.
4. Dynamically calculate the duration of each phase so that the sum matches the user's total duration (${
    months ?? ""
  } months). Each phase duration must be a positive number in months, rounded to one decimal point. Do NOT use weeks anywhere.
5. Predict a success score (0.0 to 1.0) based on the user's profile and answers. Do not use any backend value—calculate it yourself.
6. All resource URLs must be real, working links.
 For every topic, subtopic, and project in the roadmap, you MUST provide at least five resources (more is good), and all must use this format:
{ "type": "documentation", "title": "<Resource Title>", "url": "<https://example.com>" }
Where <type> must be one of: "video", "article", "documentation", "project", "github", "tutorial", "course", "book". Choose the most appropriate type for each resource.
For YouTube and GitHub resources, do NOT provide direct video or repository links. Instead, generate a search URL using the resource title:
  - For YouTube: "url": "https://www.youtube.com/results?search_query=<Resource Title>"
  - For GitHub: "url": "https://github.com/search?q=<Resource Title>&type=repositories"
Replace <Resource Title> with the actual title, spaces replaced by '+'.
Do NOT provide an invalid or empty URL. Resource difficulty/level should match the topic/project difficulty.
7. IMPORTANT: Your response must be a single, valid JSON object. Do not include any explanation, markdown, comments, or extra text. If your output is not valid JSON, regenerate until it is.
8. JSON Formatting Rules: No trailing commas. All arrays and objects must be properly closed. All keys and string values must be in double quotes.
9. For each phase, limit the number of resources to a concise list suitable for card display (e.g., 2-3 resources per topic/project). Indicate in the JSON if more resources are available for a topic/project, so the frontend can show a 'View More' button. Do not overload the roadmap view with too many resources.
10. Ensure the resource list and titles are formatted for a clean, modern UI/UX, matching the current app style. Do not change colors or style, but make the resource display user-friendly and easy to scan.
11. You MUST calculate  "dailyCommitment" (hours per day, e.g. "2h/day") and "studySessions" (sessions per day, e.g. "2/day"). These must be based on the user's assessment answers and personalNeeds. Ensure the roadmap tasks are distributed to match these values, so the user receives a realistic and achievable workload.

**JSON OUTPUT FORMAT:**
{
  "title": "Personalized Learning Roadmap",
  "description": "A learning journey tailored to your goals in ${fieldString}.",
  "totalDuration": ${typeof months === "number" ? months : `"${months}"`},
  "dailyCommitment": "<AI_CALCULATED>",
  "studySessions": "<AI_CALCULATED>",
  "successPrediction": "<AI_PREDICTED>",
  "phases": [
    {
      "phase": 1,
      "title": "Phase 1 Title",
      "description": "Phase 1 description.",
      "duration": 1,
      "topics": [
        {
          "title": "Topic 1 Title",
          "subtopics": ["Subtopic 1", "Subtopic 2"],
          "resources": [
            {"type": "documentation", "title": "Official Docs", "url": "https://example.com"}
          ],
          "moreResourcesAvailable": true
        }
        // ...AI should generate as many topics as needed...
      ],
      "projects": ["Project 1"]
    }
    // ...AI should generate upto as many phases as are needed...
  ]
}
`;
}

// Legacy generateTaskPrompt removed

// Smaller per-phase prompt generator to fit free-tier limits
function generatePhaseTaskPrompt(context) {
  const {
    field,
    phase,
    phaseNumber,
    studySessions,
    dailyCommitment,
    minDaysForPhase,
    personalize,
    assessmentQA,
  } = context;
  const safePhase = phase || {};
  const phaseTitle = safePhase.title || `Phase ${phaseNumber}`;
  const phaseTopics = Array.isArray(safePhase.topics) ? safePhase.topics : [];
  const phaseProjects = Array.isArray(safePhase.projects)
    ? safePhase.projects
    : [];
  return `You are a senior curriculum architect and prompt engineer. Generate DAILY tasks ONLY for this single phase as strict JSON.

FIELD: ${field}
PHASE NUMBER: ${phaseNumber}
PHASE TITLE: ${phaseTitle}
PHASE TOPICS: ${JSON.stringify(phaseTopics)}
PHASE PROJECTS: ${JSON.stringify(phaseProjects)}
USER PERSONALIZATION: ${
    typeof personalize === "string" ? personalize : JSON.stringify(personalize)
  }
USER ASSESSMENT Q&A (use this to decide level, time, consistency, motivation):
${assessmentQA || ""}

REQUIREMENTS:
- Personalize EVERY task to the user's level, time, and motivation derived from the assessment Q&A and personalization. Make decisions accordingly.
- Generate at least ${minDaysForPhase} distinct days of tasks for this phase. Label each task with "phase"=${phaseNumber}.
- For each day, create ${Math.max(
    2,
    Math.min(3, Number(studySessions) || 2)
  )} tasks guided by studySessions=${studySessions} and dailyCommitment=${dailyCommitment}. Beginners get smaller tasks; advanced users get deeper, combined tasks.
- Synchronize tasks with this phase's topics/projects and the overall roadmap order. Maintain logical progression.
- For EVERY task, provide:
  - Clear, simple "taskInstructions" (step-by-step, what to do in plain words).
  - "submissionRequirements": include "format" (one of: pdf, excel, link, text, none) and an explicit list "deliverables" describing exactly what must be present in the submission.
  - "successCriteria": a checklist of objective key points used to auto-verify the submission. Keep them specific and measurable.
  - 2-3 high-quality resources with REAL URLs. For YouTube and GitHub, provide SEARCH URLs only:
    * YouTube: https://www.youtube.com/results?search_query=<Resource+Title>
    * GitHub: https://github.com/search?q=<Resource+Title>&type=repositories
  - Choose resource types from: video, article, documentation, project, github, tutorial, course, book.
- Output JSON ONLY with shape: { "tasks": [ { ... } ] }; NO markdown or comments; valid strict JSON.
- IMPORTANT: Do NOT include phrases like 'Day 1', 'Day 2', etc. in the task title. The title should only describe the task itself, not the day or order.

JSON TASK SHAPE (example; generate many tasks):
{
  "title": "Task title (do not include day number)",
  "description": "Short overview of what the user will accomplish today.",
  "taskInstructions": "1) Step 1 ...\n2) Step 2 ...\n3) Step 3 ...",
  "submissionRequirements": { "format": "pdf", "deliverables": ["Key point A present", "Screenshots of output", "Code link or snippet"] },
  "type": "learning|practice|project|review",
  "phase": ${phaseNumber},
  "sequenceOrder": 1,
  "difficulty": 1,
  "estimatedTime": 1.0,
  "priority": "medium",
  "status": "queued",
  "topics": ["..."],
  "resources": [ { "type": "documentation", "title": "...", "url": "https://example.com" } ],
  "realWorldApplication": "Where this is applied at work.",
  "successCriteria": ["Contains <X>", "Demonstrates <Y>", "Achieves <Z>"]
}
`;
}

// --- AI CONTROLLERS ---
const generateRoadmapForContext = async (context) => {
  let { answers, personalize, duration, userId } = context;
  // If answers or duration missing, fetch from DB using userId
  if (
    (!Array.isArray(answers) || answers.length === 0 || !duration) &&
    userId
  ) {
    const AssessmentAnswers = (await import("../models/AssessmentAnswers.js"))
      .default;
    const assessmentDoc = await AssessmentAnswers.findOne({ user: userId });
    if (assessmentDoc) {
      answers = assessmentDoc.answers;
      personalize = assessmentDoc.personalize || "";
      duration = assessmentDoc.duration || 3;
    }
  }
  const missingFields = [];
  if (!Array.isArray(answers) || answers.length === 0)
    missingFields.push("answers");
  if (!duration || typeof duration !== "number") missingFields.push("duration");
  if (missingFields.length > 0) {
    console.error("[AIController] Missing fields for roadmap:", missingFields);
    throw new ErrorResponse(`Missing fields: ${missingFields.join(", ")}`, 400);
  }

  // Ensure field is set from path for downstream use
  const field = typeof context.path === "string" ? context.path : "";
  // Ensure both 'path' and 'field' are set for DB and frontend compatibility
  context.path = field;
  context.field = field;
  const roadmapPrompt = generateRoadmapPrompt({
    answers,
    personalize,
    duration,
    path: field,
  });
  // Log the AI prompt for roadmap generation
  console.log("[AIController] Roadmap Generation Prompt:\n", roadmapPrompt);
  const roadmapModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction:
      "You must respond ONLY with valid, strict JSON. Do not include any markdown, comments, or extra text. The JSON must be parseable and must not contain trailing commas, missing brackets, or syntax errors. If you cannot generate valid JSON, regenerate your output until it is valid.",
  });
  try {
    const roadmapResponse = await roadmapModel.generateContent(roadmapPrompt);
    const roadmapRawText = roadmapResponse?.response?.text();
    try {
      await saveRawAIOutput(
        "roadmap",
        { userId, route: "/ai/generate-roadmap" },
        roadmapRawText || ""
      );
    } catch {}
    const roadmapFirstBrace = roadmapRawText.indexOf("{");
    const roadmapLastBrace = roadmapRawText.lastIndexOf("}");
    let roadmapCleanedJson = "";
    if (
      typeof roadmapRawText === "string" &&
      roadmapFirstBrace !== -1 &&
      roadmapLastBrace !== -1 &&
      roadmapLastBrace > roadmapFirstBrace
    ) {
      roadmapCleanedJson = cleanJsonText(
        roadmapRawText.substring(roadmapFirstBrace, roadmapLastBrace + 1)
      );
    }
    if (!roadmapCleanedJson || roadmapCleanedJson.trim().length === 0) {
      console.error(
        "[AIController] Empty or malformed roadmap JSON from AI:",
        roadmapRawText
      );
      throw new ErrorResponse("AI did not return valid roadmap JSON.", 500);
    }
    try {
      return JSON.parse(roadmapCleanedJson);
    } catch (parseErr) {
      console.error(
        "[AIController] Error parsing roadmap JSON:",
        roadmapCleanedJson
      );
      throw new ErrorResponse("Failed to parse roadmap JSON from AI.", 500);
    }
  } catch (err) {
    console.error("[AIController] Error during roadmap generation:", err);
    console.error("[AIController] Roadmap Generation Prompt Context:", {
      answers,
      personalize,
      duration,
    });
    try {
      // Try to log the raw response if available
      const roadmapResponse = await roadmapModel.generateContent(roadmapPrompt);
      const roadmapRawText = roadmapResponse?.response?.text();
      console.error(
        "[AIController] Roadmap Generation Raw AI Response:",
        roadmapRawText
      );
    } catch (innerErr) {
      console.error("[AIController] Error fetching raw AI response:", innerErr);
    }
    throw err;
  }
};

// Legacy generateTasksForContext removed

// --- EXPRESS CONTROLLERS ---
const generateRoadmapWithAI = catchAsync(async (req, res) => {
  console.log(
    "[AIController] /api/ai/generate-roadmap called with body:",
    JSON.stringify(req.body, null, 2)
  );
  if (typeof req.body.personalize !== "undefined") {
    console.log(
      "[AIController] personalize field received:",
      req.body.personalize
    );
  } else {
    console.log(
      "[AIController] personalize field missing, setting to empty string."
    );
    req.body.personalize = "";
  }
  try {
    const roadmap = await generateRoadmapForContext(req.body);
    res.status(200).json({ success: true, data: roadmap });
  } catch (err) {
    console.error("[AIController] Error in generateRoadmapWithAI:", err);
    res
      .status(err.statusCode || 500)
      .json({ error: "Failed to generate roadmap", details: err.message });
  }
});

// Legacy generateTasksWithAI removed

// --- EXPORT ---
export { generateRoadmapForContext, generateRoadmapWithAI };

export default router;
