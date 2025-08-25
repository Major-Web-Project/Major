// --- STREAMING PROGRESS SSE ENDPOINTS ---
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import catchAsync from "../utils/catchAsync.js";
import ErrorResponse from "../utils/ErrorResponse.js";
import Goal from "../models/Goal.js";
import Task from "../models/Task.js";
import AssessmentAnswers from "../models/AssessmentAnswers.js";
import { cleanupIncompleteGoals } from "./goalController.js";
// ...existing code...
const router = express.Router();

// Robust JSON repair function for AI-generated responses
function repairJsonStructure(jsonString) {
  console.log("[AIController] Starting JSON repair process...");

  try {
    // First, try parsing as-is
    const parsed = JSON.parse(jsonString);
    console.log("[AIController] JSON is already valid");
    return jsonString;
  } catch (error) {
    console.log("[AIController] JSON needs repair, error:", error.message);
  }

  let repaired = jsonString;

  // Step 1: Basic cleanup
  repaired = repaired.trim();

  // Step 2: Remove any text before the first '[' and after the last ']'
  const firstBracket = repaired.indexOf("[");
  const lastBracket = repaired.lastIndexOf("]");

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    repaired = repaired.substring(firstBracket, lastBracket + 1);
    console.log("[AIController] Extracted array content between brackets");
  }

  // Step 3: Fix common JSON issues
  // Remove trailing commas before closing brackets/braces
  repaired = repaired.replace(/,(\s*[\]}])/g, "$1");

  // Fix missing commas between array elements (common AI mistake)
  repaired = repaired.replace(/\]\s*\[/g, "], [");
  repaired = repaired.replace(/\}\s*\{/g, "}, {");
  repaired = repaired.replace(/"\s*"/g, '", "');

  // Fix quotes around strings that might be missing
  repaired = repaired.replace(
    /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
    '$1"$2":'
  );

  // Step 4: Handle unclosed brackets/braces
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;

  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += "]";
  }

  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += "}";
  }

  // Step 5: Try to parse again
  try {
    const parsed = JSON.parse(repaired);
    console.log("[AIController] JSON successfully repaired");
    return repaired;
  } catch (error) {
    console.log(
      "[AIController] Basic repair failed, attempting advanced repair..."
    );
  }

  // Step 6: Advanced repair - reconstruct the expected array structure
  try {
    // Let's try to parse it step by step and reconstruct

    // Remove everything except the core array content
    let coreContent = repaired;

    // Find the main content between outermost brackets
    const match = coreContent.match(/\[(.*)\]/s);
    if (match) {
      coreContent = match[1];
    }

    // Split by major separators and try to reconstruct
    const majorParts = [];
    let bracketCount = 0;
    let currentPart = "";
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < coreContent.length; i++) {
      const char = coreContent[i];

      if (escapeNext) {
        currentPart += char;
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        currentPart += char;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
      }

      if (!inString) {
        if (char === "[") bracketCount++;
        if (char === "]") bracketCount--;

        if (char === "," && bracketCount === 0) {
          majorParts.push(currentPart.trim());
          currentPart = "";
          continue;
        }
      }

      currentPart += char;
    }

    if (currentPart.trim()) {
      majorParts.push(currentPart.trim());
    }

    // Reconstruct each part as a valid array element
    const repairedParts = majorParts.map((part) => {
      if (!part.startsWith("[")) part = "[" + part;
      if (!part.endsWith("]")) part = part + "]";

      try {
        JSON.parse(part);
        return part;
      } catch {
        // Further repair this part if needed
        return part;
      }
    });

    const reconstructed = "[" + repairedParts.join(", ") + "]";

    try {
      const parsed = JSON.parse(reconstructed);
      console.log("[AIController] JSON successfully reconstructed");
      return reconstructed;
    } catch (error) {
      console.log("[AIController] Reconstruction failed:", error.message);
    }
  } catch (error) {
    console.log("[AIController] Advanced repair failed:", error.message);
  }

  // Step 7: Last resort - return the best attempt
  console.log(
    "[AIController] All repair attempts failed, returning best attempt"
  );
  return repaired;
}

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
    // Log the full prompt sent to the AI
    console.log("[AIController] Roadmap prompt sent to AI:\n", roadmapPrompt);
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

    const firstBrace = aiText.indexOf("{");
    const lastBrace = aiText.lastIndexOf("}");
    let roadmapJson = null;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const aiRawJson = aiText.substring(firstBrace, lastBrace + 1);
      console.log("[AIController] Raw AI roadmap response:", aiRawJson);

      let cleaned = cleanJsonText(aiRawJson);
      console.log("[AIController] Cleaned AI roadmap JSON:", cleaned);

      // Use repair function for roadmap JSON as well
      cleaned = repairJsonStructure(cleaned);
      console.log(
        "[AIController] Repaired AI roadmap JSON length:",
        cleaned.length
      );

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
          cleaned.substring(0, 500),
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

      // Fetch complete assessment data from the database
      let fullAssessmentData = { answers: context.answers || [] };
      try {
        const assessmentDoc = await AssessmentAnswers.findOne({ user: userId });
        if (assessmentDoc) {
          fullAssessmentData = {
            answers: assessmentDoc.answers || [],
            personalize: assessmentDoc.personalize || "",
            duration: assessmentDoc.duration || 3,
            path: assessmentDoc.path || "",
            updatedAt: assessmentDoc.updatedAt,
          };
          console.log(
            "[AIController] Retrieved full assessment data:",
            fullAssessmentData
          );
        } else {
          console.warn(
            "[AIController] No assessment data found for user:",
            userId
          );
        }
      } catch (assessmentError) {
        console.error(
          "[AIController] Error fetching assessment data:",
          assessmentError
        );
      }

      // Ensure 'field' is set: if empty, use 'path'
      let field = context.field;
      if (!field || field === "") {
        field = context.path || "";
      }

      console.log("[AIController] Goal creation data:", {
        personalize: context.personalize,
        personalizeLength: context.personalize ? context.personalize.length : 0,
        fullAssessmentData: fullAssessmentData,
      });

      const goalData = {
        user: userId,
        field,
        path: context.path || "",
        description: context.description || "AI-generated goal",
        timeline: context.duration || 3,
        roadmap: roadmapJson,
        userProfile: {
          personalize: context.personalize || "",
        },
        assessmentData: fullAssessmentData,
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
router.get("/tasks/stream", async (req, res) => {
  console.log("[SSE] /tasks/stream request received", req.query);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  function send(stage, percent, extra = {}) {
    console.log(
      `[SSE] Sending task event: stage=${stage}, percent=${percent}, extra=${JSON.stringify(
        extra
      )}`
    );
    res.write(`data: ${JSON.stringify({ stage, percent, ...extra })}\n\n`);
  }

  try {
    const { goalId, personalization } = req.query;

    if (!goalId) {
      send("Error", 100, { error: "Goal ID is required" });
      res.end();
      return;
    }

    send("Loading goal and roadmap data...", 10);
    const goal = await Goal.findById(goalId);
    if (!goal) {
      send("Error", 100, { error: "Goal not found" });
      res.end();
      return;
    }
    if (!goal.roadmap || !Array.isArray(goal.roadmap?.phases)) {
      send("Error", 100, { error: "Goal has no roadmap phases" });
      res.end();
      return;
    }

    // Extract learning style from assessmentData if available
    let learningStyle = null;
    console.log("[AIController] Goal assessmentData:", goal.assessmentData);

    if (
      goal.assessmentData &&
      Array.isArray(goal.assessmentData.answers) &&
      goal.assessmentData.answers.length > 0
    ) {
      // The first question is usually learning style
      const idx = goal.assessmentData.answers[0];
      const meta = assessmentMeta[0];
      console.log(
        "[AIController] Extracting learning style: idx =",
        idx,
        "meta =",
        meta
      );

      if (meta && meta.options[idx]) {
        learningStyle = meta.options[idx].label;
        console.log("[AIController] Extracted learning style:", learningStyle);
      } else {
        console.warn("[AIController] Invalid learning style index or meta:", {
          idx,
          meta,
        });
      }
    } else {
      console.warn(
        "[AIController] No valid assessment data found for learning style extraction"
      );
    }

    send("Analyzing learning requirements...", 20);
    const personalizationStr =
      personalization || goal.userProfile?.personalize || "";
    console.log("[AIController] Personalization sources:", {
      personalization: personalization,
      goalUserProfile: goal.userProfile,
      goalUserProfilePersonalize: goal.userProfile?.personalize,
      finalPersonalizationStr: personalizationStr,
    });
    const meta = computeTaskGenerationMeta(goal, personalizationStr);

    send("Building comprehensive task prompt...", 30);
    const prompt = buildTaskPrompt({
      personalization: personalizationStr,
      roadmap: goal.roadmap,
      meta,
      learningStyle,
    });
    console.log("[AIController] Task Prompt (with learning style):\n", prompt);
    console.log("[AIController] Prompt type:", typeof prompt);
    console.log(
      "[AIController] Prompt length:",
      prompt ? prompt.length : "undefined"
    );

    send("Connecting to AI for task generation...", 40);
    console.log("[AIController] Initializing Google AI model...");
    console.log(
      "[AIController] API Key configured:",
      process.env.GEMINI_API_KEY ? "YES" : "NO"
    );
    console.log(
      "[AIController] API Key length:",
      process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : "N/A"
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Changed from gemini-2.5-flash to stable version
    });

    console.log("[AIController] Model initialized successfully");

    send("Generating comprehensive task structure...", 50);
    console.log(
      "[AIController] About to call generateContentStream with prompt:",
      prompt ? "valid string" : "invalid/undefined"
    );
    console.log("[AIController] Prompt length:", prompt?.length);
    console.log(
      "[AIController] Prompt preview:",
      prompt?.substring(0, 200) + "..."
    );

    try {
      const stream = await model.generateContentStream(prompt);
      let aiText = "";
      let percent = 55;
      let chunkCount = 0;

      console.log("[AIController] Starting to process stream...");

      for await (const chunk of stream.stream) {
        chunkCount++;

        if (chunk && chunk.text) {
          const chunkText = chunk.text();
          console.log(
            `[SSE] [TASKS] Chunk #${chunkCount} text:`,
            chunkText.substring(0, 100) + (chunkText.length > 100 ? "..." : "")
          );
          aiText += chunkText;
          percent = Math.min(percent + 3, 95);
          send("AI generating...", percent, { partial: aiText.slice(-200) });
        } else {
          console.log(
            `[AIController] Chunk #${chunkCount} has no text content`
          );
        }
      }

      console.log(
        `[AIController] Stream processing complete. Total chunks: ${chunkCount}, Total text length: ${aiText.length}`
      );
      console.log(
        "[AIController] Final AI response preview:",
        aiText.substring(0, 500) + (aiText.length > 500 ? "..." : "")
      );

      if (!aiText || aiText.trim().length === 0) {
        console.error(
          "[AIController] WARNING: No text received from AI stream!"
        );
        throw new Error("AI did not generate any response");
      }

      send("Processing and saving task data...", 97);
      // Directly save the raw AI output as taskPromptOutput (renamed from arrText/tasks5D)
      goal.taskPromptOutput = aiText.trim();
      goal.tasksGenerated = true;
      await goal.save();

      // Always create Task documents after generation with enhanced features
      let createdTasksCount = 0;
      let taskCreationError = null;

      send("Creating individual task documents with enhanced metadata...", 90);
      try {
        const result = await processAndCreateTasksFromGoal(
          goal._id,
          (message, progress) => {
            send(message, progress);
          }
        );
        createdTasksCount = result.createdTasks
          ? result.createdTasks.length
          : 0;

        if (result.skipped) {
          send("Tasks already exist, using existing tasks", 99);
        } else {
          console.log(
            `[SSE] Successfully created ${createdTasksCount} enhanced task documents`
          );
        }

        // Call the task scheduler to assign first two tasks automatically
        try {
          const { assignFirstTwoTasksForToday } = await import(
            "../services/taskScheduler.js"
          );
          const assignedTasks = await assignFirstTwoTasksForToday(
            goal.user,
            goal._id
          );
          console.log(
            `[SSE] Assigned ${assignedTasks.length} tasks to user for today`
          );
        } catch (assignError) {
          console.error("[SSE] Error assigning initial tasks:", assignError);
          // Don't fail the whole process for assignment error
        }

        console.log(
          `[SSE] ${
            result.skipped ? "Found existing" : "Created"
          } ${createdTasksCount} enhanced task documents for goal ${goal._id}`
        );
      } catch (error) {
        console.error("[SSE] Error creating task documents:", error);
        taskCreationError = error.message;
      }

      send("All tasks created and saved!", 100, {
        taskPromptOutput: goal.taskPromptOutput,
        goalId: goal._id,
        tasksCreated: createdTasksCount > 0 ? createdTasksCount : null,
        totalTasksGenerated: createdTasksCount > 0 ? createdTasksCount : null,
        taskCreationError: taskCreationError,
      });
      res.end();
    } catch (streamError) {
      console.error("[AIController] Error during AI streaming:", streamError);
      throw streamError;
    }
  } catch (err) {
    console.error("[SSE] Task generation error:", err);
    send("Error", 100, { error: err.message });
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
  // Remove markdown code blocks
  let cleaned = jsonText.replace(/```json\s*([\s\S]*?)```/i, "$1").trim();

  // Remove any trailing text after the last closing brace
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }

  try {
    // First, try to parse as-is
    JSON.parse(cleaned);
    return cleaned;
  } catch (error) {
    console.log("[cleanJsonText] Initial parse failed, attempting fixes...");
    console.log("[cleanJsonText] Error:", error.message);
    console.log(
      "[cleanJsonText] Error position:",
      error.message.match(/position (\d+)/)?.[1]
    );

    // Common JSON fixes
    let fixed = cleaned;

    // Fix 1: Remove trailing commas in objects and arrays
    fixed = fixed.replace(/,(\s*[}\]])/g, "$1");

    // Fix 2: Add missing commas between array elements (common AI mistake)
    // Look for patterns like }" followed by "{ without a comma
    fixed = fixed.replace(/}(\s*)"/g, '},$1"');
    fixed = fixed.replace(/}(\s*){/g, "},$1{");
    fixed = fixed.replace(/](\s*)"/g, '],$1"');
    fixed = fixed.replace(/](\s*){/g, "],$1{");
    fixed = fixed.replace(/"(\s*)"/g, '",$1"');
    fixed = fixed.replace(/"(\s*){/g, '",$1{');
    fixed = fixed.replace(/"(\s*)\[/g, '",$1[');

    // Fix 2.1: Specific fix for the error pattern in your example
    // Pattern: }" followed by whitespace and then { (missing comma between objects in array)
    fixed = fixed.replace(/}(\s+){/g, "},$1{");

    // Fix 2.2: Handle resource arrays specifically - fix the exact pattern from your error
    // Pattern: } followed by newline/spaces and then { (missing comma between objects in array)
    fixed = fixed.replace(/}(\s*\n\s*){/g, "},$1{");
    fixed = fixed.replace(/}(\s*),(\s*){/g, "},$1$2{"); // Remove double commas if created

    // Fix 2.3: Handle arrays of objects with missing commas
    fixed = fixed.replace(/}(\s+){\s*"type"/g, '},$1{ "type"');
    fixed = fixed.replace(/}(\s*){\s*"type"/g, '},$1{ "type"');

    // Fix 3: Fix missing commas after closing brackets/braces when followed by opening ones
    fixed = fixed.replace(/}(\s*)\[/g, "},$1[");
    fixed = fixed.replace(/](\s*)\[/g, "],$1[");

    // Fix 4: Fix specific URL and string issues (be more conservative with escaping)
    // Handle URLs that might break JSON parsing
    fixed = fixed.replace(/("url":\s*"[^"]*?)"/g, (match, group1) => {
      // Don't escape quotes in URLs, but ensure they're properly closed
      return group1 + '"';
    });

    // Fix 5: Remove any characters before the first { or [
    const firstBracket = Math.max(fixed.indexOf("{"), fixed.indexOf("["));
    if (firstBracket > 0) {
      fixed = fixed.substring(firstBracket);
    }

    // Fix 6: Ensure the JSON ends properly
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;

    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += "}";
    }

    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBraces; i++) {
      fixed += "]";
    }

    try {
      // Test the fixed version
      JSON.parse(fixed);
      console.log("[cleanJsonText] Successfully fixed JSON syntax");
      return fixed;
    } catch (secondError) {
      console.error("[cleanJsonText] Could not fix JSON:", secondError.message);
      console.error(
        "[cleanJsonText] Original text:",
        jsonText.substring(0, 500)
      );
      console.error("[cleanJsonText] Fixed attempt:", fixed.substring(0, 500));

      // As a last resort, try to extract and reconstruct the JSON
      try {
        // Attempt to parse individual JSON objects/arrays if it's malformed
        const lines = fixed.split("\n").filter((line) => line.trim());
        let reconstructed = "";
        let inString = false;
        let braceCount = 0;
        let bracketCount = 0;

        for (let char of fixed) {
          if (
            char === '"' &&
            reconstructed[reconstructed.length - 1] !== "\\"
          ) {
            inString = !inString;
          }

          if (!inString) {
            if (char === "{") braceCount++;
            if (char === "}") braceCount--;
            if (char === "[") bracketCount++;
            if (char === "]") bracketCount--;
          }

          reconstructed += char;

          // If we've closed all braces and brackets, we might have a complete JSON
          if (
            braceCount === 0 &&
            bracketCount === 0 &&
            reconstructed.trim().length > 0
          ) {
            try {
              JSON.parse(reconstructed);
              console.log("[cleanJsonText] Successfully reconstructed JSON");
              return reconstructed;
            } catch (e) {
              // Continue building
            }
          }
        }

        throw new Error("Could not reconstruct valid JSON");
      } catch (thirdError) {
        console.error("[cleanJsonText] All fixes failed:", thirdError.message);
        throw new Error(
          `JSON parsing failed: ${
            error.message
          }. Original: ${jsonText.substring(0, 200)}...`
        );
      }
    }
  }
}

// Removed validateAndSanitizeTasksResponse (only used by deprecated per-phase task generation)

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
2. The user has chosen the field "${fieldString}". You must generate a comprehensive, professional roadmap specifically for this field. Focus exclusively on topics, skills, and technologies relevant to "${fieldString}". Do NOT include content from unrelated fields.
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

// --- TASK GENERATION PROMPT BUILDER ---
// --- PRE-PROCESSING FOR TASK DISTRIBUTION ---
function computeTaskGenerationMeta(goal, personalization) {
  const roadmap = goal?.roadmap || {};
  const totalMonths = roadmap.totalDuration || goal.timeline || 3; // months
  const approxTotalDays = Math.round(totalMonths * 30); // simple month->day mapping
  const studyDays = Math.max(1, Math.round(approxTotalDays * (5 / 7))); // exclude weekends
  // Parse daily commitment like "2h/day"
  let dailyCommitmentHours = 2;
  if (typeof roadmap.dailyCommitment === "string") {
    const match = roadmap.dailyCommitment.match(/(\d+(?:\.\d+)?)\s*h/i);
    if (match) dailyCommitmentHours = parseFloat(match[1]);
  }
  const phases = Array.isArray(roadmap.phases) ? roadmap.phases : [];
  const topicCount = phases.reduce(
    (acc, p) => acc + ((p.topics || []).length || 0),
    0
  );
  const minTasksPerTopic = 15;
  const minimalTotalTasks = topicCount * minTasksPerTopic;
  const baselineDailyTasks = 2; // at least 2 tasks per study day
  const suggestedTotalTasks = Math.max(minimalTotalTasks, studyDays);
  const tasksPerDay = Math.max(
    baselineDailyTasks,
    Math.ceil(suggestedTotalTasks / studyDays)
  );
  return {
    totalMonths,
    approxTotalDays,
    studyDays,
    dailyCommitmentHours,
    topicCount,
    minTasksPerTopic,
    suggestedTotalTasks,
    tasksPerDay,
    personalizationSnippet: (personalization || "").slice(0, 400),
  };
}

function buildTaskPrompt({ personalization, roadmap, meta, learningStyle }) {
  const phases = Array.isArray(roadmap?.phases) ? roadmap.phases : [];
  const phasesJson = JSON.stringify(
    phases.map((p) => ({
      phase: p.phase,
      title: p.title,
      duration: p.duration,
      topics: (p.topics || []).map((t) => ({
        title: t.title,
        subtopics: t.subtopics || [],
        resources: (t.resources || []).slice(0, 6),
      })),
      projects: p.projects || [],
    }))
  );

  const metaLines = `TOTAL_MONTHS: ${meta.totalMonths}\nAPPROX_TOTAL_DAYS: ${meta.approxTotalDays}\nSTUDY_DAYS_EXCLUDING_WEEKENDS: ${meta.studyDays}\nDAILY_COMMITMENT_HOURS: ${meta.dailyCommitmentHours}\nTOPIC_COUNT: ${meta.topicCount}\nMIN_TASKS_PER_TOPIC: ${meta.minTasksPerTopic}\nTARGET_TOTAL_TASKS (>= min & ~days): ${meta.suggestedTotalTasks}\nTASKS_PER_DAY_TARGET: ${meta.tasksPerDay}`;

  const learningStyleLine = learningStyle
    ? `LEARNING_STYLE: "${learningStyle}"

When generating tasks, adapt the format and approach to match the user's preferred learning style: ${learningStyle}.
`
    : "";

  return `**CRITICAL: Output ONLY plain text with delimited task data. No keys, no JSON, no explanation, no markdown.**

**STRICT PTT FORMAT:**
- Phase: Capital letter (A, B, C, ...)
- Topic: Lowercase letter (a, b, c, ...)
- Task: Number (1, 2, 3, ...)

**REQUIRED OUTPUT FORMAT:**
All tasks must be output as a single string, with each task in the format:
PTT|||TITLE|||DESCRIPTION|||RESOURCES|||DURATION~
Where PTT = Phase (capital letter) + Topic (lowercase letter) + Task number.

**SAMPLE OUTPUT (all tasks in one line):**
Aa1|||Learn NumPy Basics|||Study NumPy fundamentals and array creation.|||documentation|NumPy Docs|https://numpy.org/doc/,video|NumPy Tutorial|https://www.youtube.com/results?search_query=NumPy+Tutorial|||1h~Aa2|||Practice NumPy Indexing|||Work with array indexing and slicing.|||documentation|NumPy Indexing|https://numpy.org/doc/stable/user/basics.indexing.html,video|NumPy Indexing|https://www.youtube.com/results?search_query=NumPy+Indexing|||1h~Ab1|||Pandas DataFrame Creation|||Create Pandas DataFrames from data.|||documentation|Pandas Docs|https://pandas.pydata.org/docs/,video|Pandas DataFrame|https://www.youtube.com/results?search_query=Pandas+DataFrame|||1h~Ba1|||Matplotlib Plotting|||Create basic plots using Matplotlib.|||documentation|Matplotlib Docs|https://matplotlib.org/stable/tutorials/introductory/pyplot.html,video|Matplotlib Tutorial|https://www.youtube.com/results?search_query=Matplotlib+Tutorial|||1h~

**STRICT TASK GENERATION RULES:**
- For every phase in the roadmap, and for every topic in that phase, generate exactly 15 tasks.
- Use the PTT code: [Phase letter][Topic letter][Task number], e.g., Aa1, Aa2, ..., Ab1, Ab2, ..., Ba1, etc.
- Do not skip any topic or phase. Always generate 15 tasks per topic, even if it seems repetitive.
- Do not do any reasoning or decide to reduce the number of tasks. Just follow the structure.
- Example: If there are 2 phases (A, B) and 3 topics per phase (a, b, c), you must generate 2 x 3 x 15 = 90 tasks.

**FORMAT RULES:**
- PTT: Use the format described above (e.g., Aa1, Aa2, Ab1, Ba1, ...)
- TITLE: Task title as plain text
- DESCRIPTION: Task description as plain text
- RESOURCES: Multiple resources separated by commas, each in format "type|title|url"
- DURATION: Duration like "1h", "30 min", "2h", "4h".
- Each task MUST end with ~ (tilde symbol)

**RESOURCE GENERATION RULES:**
- Each task MUST have at least 2 resources
- Use resources from the roadmap topics when relevant to the task PTT
- Supplement with additional relevant resources when needed
- Prefer learning resources that match the personalization preference
- Use these resource types: documentation, article, video,github, book, reference.
- Generate specific, actionable resource URLs when possible

**CRITICAL REQUIREMENTS:**
1. Use ||| to separate the 5 main fields within each task
2. Use commas to separate multiple resources within the RESOURCES field
3. Each resource must be in format "type|title|url" (using single |)
4. End every task with ~ (tilde) - this separates tasks from each other
5. Never use ~ anywhere except at the end of each task
6. Never use ||| inside any field value
7. Output ONLY the task data - no other text, no headers, no explanations
8. For each phase, for each topic, generate exactly 15 tasks (e.g., Aa1, Aa2, ..., Ab1, ..., Ba1, ...)

INPUT DATA:
${learningStyleLine}PERSONALIZATION: "${(personalization || "").replace(
    /"/g,
    '"'
  )}"
ROADMAP: ${phasesJson}
META: ${metaLines}

**REMEMBER: Output ONLY the delimited task data. Each task must end with ~ (tilde). No other text.**
**CRITICAL: Use the new PTT format (Phase=capital, Topic=lowercase, Task=number) as shown in the examples.**
**CRITICAL: Ensure each task has at least 2 relevant, high-quality resources.**`;
}

async function generateTasksForGoal(goalId, options = {}) {
  const { onProgress } = options;

  // Progress reporting function
  const reportProgress = (stage, percent) => {
    if (onProgress && typeof onProgress === "function") {
      onProgress(stage, percent);
    }
  };

  reportProgress("Loading goal and roadmap data...", 15);

  const goal = await Goal.findById(goalId);
  if (!goal) throw new ErrorResponse("Goal not found", 404);
  if (!goal.roadmap || !Array.isArray(goal.roadmap?.phases)) {
    throw new ErrorResponse("Goal has no roadmap phases", 400);
  }

  reportProgress("Analyzing learning requirements...", 25);

  const personalization =
    options.personalization || goal.userProfile?.personalize || "";
  const meta = computeTaskGenerationMeta(goal, personalization);

  reportProgress("Building comprehensive task prompt...", 35);

  const prompt = buildTaskPrompt({
    personalization,
    roadmap: goal.roadmap,
    meta,
  });
  console.log("[AIController] Task Prompt:\n", prompt);

  reportProgress("Connecting to AI for task generation...", 45);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  reportProgress("Generating comprehensive task structure...", 60);

  const response = await model.generateContent(prompt);
  const raw = response?.response?.text?.() || "";

  reportProgress("Processing and validating task data...", 70);

  let arrText = raw.trim();

  // Remove markdown code blocks if present
  arrText = arrText.replace(/^```json?\s*/, "").replace(/\s*```$/, "");

  reportProgress("Saving task structure to database...", 80);

  goal.taskPromptOutput = arrText; // store raw string
  goal.tasksGenerated = true;
  await goal.save();

  reportProgress("AI generation complete, creating tasks...", 90);

  return {
    taskPromptOutput: arrText,
    goalId: goal._id,
    tasksCreated: null,
    totalTasksGenerated: null,
  };
}

const generateTasksEndpoint = catchAsync(async (req, res) => {
  const { goalId, personalization } = req.body || {};
  if (!goalId) {
    return res.status(400).json({ error: "goalId required" });
  }
  try {
    const result = await generateTasksForGoal(goalId, { personalization });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[AIController] Tasks generation error", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Failed" });
  }
});

// Remove all the old 5D endpoints and functions
router.post("/tasks/generate", generateTasksEndpoint);

// --- NEW ENDPOINT: CREATE TASK DOCUMENTS FROM STORED AI OUTPUT ---
// Removed /tasks/create-from-output endpoint. Use only SSE-based endpoint for task creation.

// --- NEW ENDPOINT: GET TASKS FOR A GOAL ---
router.get(
  "/tasks/by-goal/:goalId",
  catchAsync(async (req, res) => {
    const { goalId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    if (!goalId) {
      return res.status(400).json({
        success: false,
        error: "goalId is required",
      });
    }

    try {
      const query = { goal: goalId };
      if (status) {
        query.status = status;
      }

      const tasks = await Task.find(query)
        .sort({ sequenceOrder: 1 }) // Sort by sequence order for proper task progression
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const totalTasks = await Task.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          tasks: tasks.map((task) => ({
            _id: task._id,
            title: task.title,
            description: task.description,
            status: task.status,
            sequenceOrder: task.sequenceOrder,
            estimatedTime: task.estimatedTime,
            category: task.category,
            phase: task.phase,
            ptt: task.aiMetadata?.ptt,
            resources: task.aiMetadata?.resources || task.resources,
            isAIGenerated: task.isAIGenerated,
            assignedDate: task.assignedDate,
            createdAt: task.createdAt,
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalTasks / limit),
            totalTasks,
            hasMore: page * limit < totalTasks,
          },
        },
      });
    } catch (error) {
      console.error("[AIController] Error fetching tasks for goal:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || "Failed to fetch tasks for goal",
      });
    }
  })
);

// --- EXPORT ---
export {
  generateRoadmapForContext,
  generateRoadmapWithAI,
  generateTasksForGoal,
};

export default router;

// --- TASK OUTPUT PARSER ---
// Converts the AI output string (with ~ as task separator) into an array of task lines
export function splitTasksByTilde(rawOutput) {
  if (!rawOutput || typeof rawOutput !== "string") return [];
  // Replace all ~ with newlines, then split by newlines, trim, and filter empty
  return rawOutput
    .replace(/~/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// --- TASK OBJECT PARSER ---
// Converts array of task lines into structured task objects
export function parseTaskLinesToObjects(taskLines) {
  if (!Array.isArray(taskLines)) return [];
  return taskLines.map((line) => {
    const [ptt, title, description, resourcesStr, duration] = line.split("|||");
    const resources = (resourcesStr || "")
      .split(",")
      .map((r) => {
        const [type, resTitle, url] = r.split("|");
        if (!type || !resTitle || !url) return null;
        return { type: type.trim(), title: resTitle.trim(), url: url.trim() };
      })
      .filter(Boolean);
    return {
      ptt: ptt ? ptt.trim() : "",
      title: title ? title.trim() : "",
      description: description ? description.trim() : "",
      resources,
      duration: duration ? duration.trim() : "",
    };
  });
}

// --- PHASE/TOPIC INFO EXTRACTOR ---
// Extracts phase and topic names from roadmap based on PTT indices
function getPhaseTopicInfo(goal, pttData) {
  try {
    if (!goal.roadmap || !goal.roadmap.phases) {
      return {
        phaseName: `Phase ${pttData.phase + 1}`,
        topicName: `Topic ${pttData.topic + 1}`,
        topicNames: [],
      };
    }

    const phaseIndex = pttData.phase; // 0-based
    const topicIndex = pttData.topic; // 0-based

    const targetPhase = goal.roadmap.phases[phaseIndex];
    if (!targetPhase) {
      return {
        phaseName: `Phase ${pttData.phase + 1}`,
        topicName: `Topic ${pttData.topic + 1}`,
        topicNames: [],
      };
    }

    const phaseName =
      targetPhase.title || targetPhase.name || `Phase ${pttData.phase + 1}`;

    if (!targetPhase.topics || !targetPhase.topics[topicIndex]) {
      return {
        phaseName,
        topicName: `Topic ${pttData.topic + 1}`,
        topicNames: targetPhase.topics
          ? targetPhase.topics
              .map((topic) => topic.title || topic.name)
              .filter(Boolean)
          : [],
      };
    }

    const targetTopic = targetPhase.topics[topicIndex];
    const topicName =
      targetTopic.title || targetTopic.name || `Topic ${pttData.topic + 1}`;

    // Extract all topic names for this phase as tags
    const topicNames = targetPhase.topics
      .map((topic) => topic.title || topic.name)
      .filter(Boolean);

    return {
      phaseName,
      topicName,
      topicNames,
    };
  } catch (error) {
    console.error("[AIController] Error extracting phase/topic info:", error);
    return {
      phaseName: `Phase ${pttData.phase + 1}`,
      topicName: `Topic ${pttData.topic + 1}`,
      topicNames: [],
    };
  }
}

// --- SUCCESS CRITERIA GENERATOR ---
// Generates meaningful success criteria based on task content
function generateSuccessCriteriaForTask(taskObj) {
  const criteria = [];

  if (!taskObj || !taskObj.title) {
    return [
      "Complete the assigned task",
      "Demonstrate understanding of the concepts",
    ];
  }

  const title = taskObj.title.toLowerCase();
  const description = (taskObj.description || "").toLowerCase();
  const fullText = `${title} ${description}`;

  // Task-specific criteria based on keywords
  if (
    fullText.includes("study") ||
    fullText.includes("learn") ||
    fullText.includes("review")
  ) {
    criteria.push("Read and understand all provided materials");
    criteria.push("Take notes on key concepts and terminology");
  }

  if (
    fullText.includes("practice") ||
    fullText.includes("implement") ||
    fullText.includes("build")
  ) {
    criteria.push("Complete hands-on exercises or coding challenges");
    criteria.push("Test and verify your implementation works correctly");
  }

  if (
    fullText.includes("project") ||
    fullText.includes("create") ||
    fullText.includes("develop")
  ) {
    criteria.push("Plan and design your approach before implementation");
    criteria.push("Create a working solution that meets the requirements");
    criteria.push("Document your code and design decisions");
  }

  if (
    fullText.includes("research") ||
    fullText.includes("explore") ||
    fullText.includes("investigate")
  ) {
    criteria.push("Find and evaluate multiple credible sources");
    criteria.push("Summarize key findings and insights");
  }

  if (
    fullText.includes("architecture") ||
    fullText.includes("design") ||
    fullText.includes("model")
  ) {
    criteria.push("Understand the structure and components");
    criteria.push("Explain how different parts work together");
  }

  // Domain-specific criteria
  if (
    fullText.includes("resnet") ||
    fullText.includes("cnn") ||
    fullText.includes("neural network")
  ) {
    criteria.push("Understand the key innovations and advantages");
    criteria.push("Be able to explain the architecture to others");
  }

  if (fullText.includes("algorithm") || fullText.includes("data structure")) {
    criteria.push("Understand time and space complexity");
    criteria.push("Implement the concept in code");
  }

  if (
    fullText.includes("framework") ||
    fullText.includes("library") ||
    fullText.includes("tool")
  ) {
    criteria.push("Set up and configure the tool correctly");
    criteria.push("Complete basic tasks using the framework");
  }

  // Resource-based criteria
  if (taskObj.resources && taskObj.resources.length > 0) {
    const hasVideo = taskObj.resources.some((r) => r.type === "video");
    const hasDoc = taskObj.resources.some(
      (r) => r.type === "documentation" || r.type === "article"
    );
    const hasTutorial = taskObj.resources.some(
      (r) => r.type === "tutorial" || r.type === "course"
    );

    if (hasVideo) {
      criteria.push("Watch all provided video materials completely");
    }
    if (hasDoc) {
      criteria.push("Read through all documentation and articles");
    }
    if (hasTutorial) {
      criteria.push("Follow along with tutorials and complete exercises");
    }
  }

  // Default criteria if none matched
  if (criteria.length === 0) {
    criteria.push("Complete the assigned learning task");
    criteria.push("Demonstrate understanding of the key concepts");
    criteria.push("Be prepared to apply the knowledge in future tasks");
  }

  // Add a final criteria about being ready for next steps
  if (criteria.length < 4) {
    criteria.push("Be prepared to apply this knowledge in subsequent tasks");
  }

  // Ensure we have a reasonable number of criteria (2-4)
  return criteria.slice(0, 4);
}

// --- PTT PARSER ---
// Parses PTT (Phase-Topic-Task) string into individual components
export function parsePTT(ptt) {
  if (!ptt || typeof ptt !== "string" || ptt.length < 3) {
    return { phase: 0, topic: 0, task: 0 };
  }

  // New format: Phase (capital letter), Topic (lowercase letter), Task (number, 1-based)
  const phase = ptt[0].charCodeAt(0) - 65; // 'A' = 0
  const topic = ptt[1].charCodeAt(0) - 97; // 'a' = 0
  const task = parseInt(ptt.slice(2), 10) - 1; // 1-based to 0-based

  return { phase, topic, task };
}

// --- RESOURCE MAPPING LOGIC ---
// Maps roadmap topic resources to individual tasks based on PTT codes
function mapTopicResourcesToTask(goal, pttData, taskResources) {
  try {
    if (!goal.roadmap || !goal.roadmap.phases) {
      return taskResources;
    }

    const phaseIndex = pttData.phase; // 0-based
    const topicIndex = pttData.topic; // 0-based

    const targetPhase = goal.roadmap.phases[phaseIndex];
    if (!targetPhase || !targetPhase.topics) {
      return taskResources;
    }

    const targetTopic = targetPhase.topics[topicIndex];
    if (!targetTopic || !targetTopic.resources) {
      return taskResources;
    }

    // If task has no resources or limited resources, supplement with topic resources
    const combinedResources = [...taskResources];
    const topicResources = targetTopic.resources || [];

    // Add topic resources if task has fewer than 2 resources
    if (combinedResources.length < 2) {
      const additionalResources = topicResources.slice(
        0,
        3 - combinedResources.length
      );
      combinedResources.push(...additionalResources);
    }

    // --- Add YouTube and GitHub search links for the task title ---
    // Find the task title from the resources or fallback to topic name
    let taskTitle = null;
    if (taskResources && taskResources.length > 0 && taskResources[0].title) {
      taskTitle = taskResources[0].title;
    } else if (targetTopic && (targetTopic.title || targetTopic.name)) {
      taskTitle = targetTopic.title || targetTopic.name;
    } else {
      taskTitle = "Learning Task";
    }
    // Use the taskTitle to generate search queries
    const searchQuery = encodeURIComponent(taskTitle.replace(/\s+/g, " "));
    combinedResources.push({
      type: "video",
      title: `YouTube Search: ${taskTitle}`,
      url: `https://www.youtube.com/results?search_query=${searchQuery}`,
    });
    combinedResources.push({
      type: "github",
      title: `GitHub Search: ${taskTitle}`,
      url: `https://github.com/search?q=${searchQuery}&type=repositories`,
    });

    return combinedResources;
  } catch (error) {
    console.error("[AIController] Error mapping topic resources:", error);
    return taskResources;
  }
}

// --- TASK CREATION LOGIC ---
// Creates Task documents from parsed task objects
export async function createTasksFromParsedData(
  goalId,
  taskObjects,
  onProgress = null
) {
  if (!goalId || !Array.isArray(taskObjects) || taskObjects.length === 0) {
    console.log("[AIController] Invalid parameters for task creation");
    return { createdTasks: [], taskIds: [] };
  }

  const goal = await Goal.findById(goalId);
  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  const createdTasks = [];
  const taskIds = [];

  console.log(
    `[AIController] Creating ${taskObjects.length} tasks for goal ${goalId}`
  );

  for (let i = 0; i < taskObjects.length; i++) {
    const taskObj = taskObjects[i];
    const pttData = parsePTT(taskObj.ptt);

    // Report progress during task creation
    if (onProgress && i % 10 === 0) {
      const progressPercent = Math.min(
        93 + Math.floor((i / taskObjects.length) * 5),
        98
      );
      onProgress(
        `Creating tasks: ${i + 1}/${taskObjects.length}`,
        progressPercent
      );
    }

    try {
      // Parse duration to estimate time in hours
      let estimatedTime = 1; // default 1 hour
      if (taskObj.duration) {
        const durationStr = taskObj.duration.toLowerCase();
        if (durationStr.includes("h")) {
          const hours =
            parseFloat(durationStr.match(/(\d+(?:\.\d+)?)\s*h/)?.[1]) || 1;
          estimatedTime = hours;
        } else if (durationStr.includes("min")) {
          const minutes =
            parseFloat(durationStr.match(/(\d+(?:\.\d+)?)\s*min/)?.[1]) || 60;
          estimatedTime = minutes / 60;
        }
      }

      // Enhance resources with topic resources from roadmap
      const enhancedResources = mapTopicResourcesToTask(
        goal,
        pttData,
        taskObj.resources || []
      );

      // Extract phase and topic information from roadmap
      const phaseInfo = getPhaseTopicInfo(goal, pttData);

      // Generate success criteria based on task content
      const successCriteria = generateSuccessCriteriaForTask(taskObj);

      const taskData = {
        user: goal.user,
        goal: goalId,
        title: taskObj.title || `Task ${i + 1}`,
        description: taskObj.description || "No description provided",
        type: "learning", // Default type for AI-generated tasks
        category: phaseInfo.phaseName || `Phase ${pttData.phase + 1}`,
        difficulty: 3,
        priority: "medium",
        estimatedTime: estimatedTime,
        sequenceOrder: i + 1, // Simple incrementing order starting from 1
        phase: pttData.phase + 1,
        dayNumber: 1,
        isAIGenerated: true,
        topics: phaseInfo.topicNames || [],
        successCriteria: successCriteria,
        aiMetadata: {
          ptt: taskObj.ptt,
          phase: pttData.phase,
          topic: pttData.topic,
          task: pttData.task,
          resources: enhancedResources,
          originalDuration: taskObj.duration,
          phaseName: phaseInfo.phaseName,
          topicName: phaseInfo.topicName,
        },
        resources: enhancedResources,
        status: "queued", // Only first two are pending, rest are queued
      };

      const createdTask = await Task.create(taskData);
      createdTasks.push(createdTask);
      taskIds.push(createdTask._id);

      console.log(
        `[AIController] Created task ${i + 1}/${taskObjects.length}: ${
          taskObj.title
        } (PTT: ${taskObj.ptt}, Order: ${pttData.sequenceOrder})`
      );
    } catch (error) {
      console.error(`[AIController] Error creating task ${i + 1}:`, error);
      // Continue with other tasks even if one fails
    }
  }

  console.log(
    `[AIController] Successfully created ${createdTasks.length} tasks`
  );
  return { createdTasks, taskIds };
}

// --- MAIN TASK PROCESSING FUNCTION ---
// Processes stored AI output and creates Task documents
export async function processAndCreateTasksFromGoal(goalId, onProgress = null) {
  console.log(`[AIController] Processing tasks for goal ${goalId}`);

  const goal = await Goal.findById(goalId);
  if (!goal) {
    throw new ErrorResponse("Goal not found", 404);
  }

  if (!goal.taskPromptOutput || goal.taskPromptOutput.trim().length === 0) {
    throw new ErrorResponse("No AI task output found for this goal", 400);
  }

  // Check if task creation is already in progress to prevent race conditions
  if (goal.isGeneratingTasks) {
    console.log(
      `[AIController] Task generation already in progress for goal ${goalId}, waiting...`
    );

    // Wait for the other process to finish and return existing tasks
    let attempts = 0;
    while (attempts < 30) {
      // Wait up to 30 seconds
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedGoal = await Goal.findById(goalId);
      if (!updatedGoal.isGeneratingTasks) {
        const existingTasks = await Task.find({
          goal: goalId,
          isAIGenerated: true,
        }).select("_id");
        return {
          goal: updatedGoal,
          createdTasks: [],
          taskIds: existingTasks.map((t) => t._id),
          totalCreated: existingTasks.length,
          skipped: true,
        };
      }
      attempts++;
    }
    throw new ErrorResponse(
      "Task generation timeout - another process is taking too long",
      408
    );
  }

  // Check if tasks already exist for this goal to prevent duplicates
  const existingTasksCount = await Task.countDocuments({
    goal: goalId,
    isAIGenerated: true,
  });
  if (existingTasksCount > 0) {
    console.log(
      `[AIController] Found ${existingTasksCount} existing tasks for goal ${goalId}, skipping creation`
    );
    const existingTasks = await Task.find({
      goal: goalId,
      isAIGenerated: true,
    }).select("_id");
    return {
      goal,
      createdTasks: [],
      taskIds: existingTasks.map((t) => t._id),
      totalCreated: existingTasksCount,
      skipped: true,
    };
  }

  // Set the lock to prevent concurrent task creation
  goal.isGeneratingTasks = true;
  await goal.save();

  try {
    if (onProgress) onProgress("Parsing AI task output...", 91);

    // Step 1: Split the raw output by tilde
    const taskLines = splitTasksByTilde(goal.taskPromptOutput);
    console.log(
      `[AIController] Split raw output into ${taskLines.length} task lines`
    );

    if (taskLines.length === 0) {
      throw new ErrorResponse("No valid task lines found in AI output", 400);
    }

    if (onProgress) onProgress("Converting tasks to objects...", 92);

    // Step 2: Parse task lines into objects
    const taskObjects = parseTaskLinesToObjects(taskLines);
    console.log(`[AIController] Parsed ${taskObjects.length} task objects`);

    // Step 3: Create Task documents in MongoDB
    const { createdTasks, taskIds } = await createTasksFromParsedData(
      goalId,
      taskObjects,
      onProgress
    );

    if (onProgress) onProgress("Updating goal references...", 99);

    // Step 4: Update the goal with the created task references
    goal.totalTasksGenerated = createdTasks.length;
    goal.tasksGenerated = true;

    // Add task IDs to completedTaskIds array structure (for tracking purposes)
    const tasksByPhase = {};
    createdTasks.forEach((task) => {
      const phase = task.aiMetadata?.phase || 0;
      if (!tasksByPhase[phase]) {
        tasksByPhase[phase] = [];
      }
      tasksByPhase[phase].push(task._id);
    });

    // Update completedTaskIds array in goal
    Object.keys(tasksByPhase).forEach((phase) => {
      const existingPhaseEntry = goal.completedTaskIds.find(
        (entry) => entry.phase === parseInt(phase)
      );
      if (existingPhaseEntry) {
        existingPhaseEntry.taskIds.push(...tasksByPhase[phase]);
      } else {
        goal.completedTaskIds.push({
          phase: parseInt(phase),
          topic: "All", // Generic topic for AI-generated tasks
          taskIds: tasksByPhase[phase],
        });
      }
    });

    await goal.save();

    console.log(
      `[AIController] Updated goal with ${createdTasks.length} task references`
    );

    // After goal and tasks are saved, clean up incomplete goals for this user
    try {
      await cleanupIncompleteGoals(goal.user);
      console.log(
        `[AIController] Ran cleanupIncompleteGoals for user ${goal.user}`
      );
    } catch (cleanupError) {
      console.error(
        `[AIController] Error running cleanupIncompleteGoals:`,
        cleanupError
      );
    }

    return {
      goal,
      createdTasks,
      taskIds,
      totalCreated: createdTasks.length,
    };
  } catch (error) {
    console.error(
      `[AIController] Error creating tasks for goal ${goalId}:`,
      error
    );
    throw error;
  } finally {
    // Always release the lock, even if an error occurred
    try {
      const updatedGoal = await Goal.findById(goalId);
      if (updatedGoal) {
        updatedGoal.isGeneratingTasks = false;
        await updatedGoal.save();
        console.log(
          `[AIController] Released task generation lock for goal ${goalId}`
        );
      }
    } catch (lockError) {
      console.error(
        `[AIController] Error releasing lock for goal ${goalId}:`,
        lockError
      );
    }
  }
}
