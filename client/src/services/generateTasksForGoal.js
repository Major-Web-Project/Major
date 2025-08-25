// Deprecated: use SSE per-phase endpoint from Assessment flow instead.
export const generateTasksForGoal = async () => {
  throw new Error(
    "Deprecated: Use /api/ai/tasks/stream-phases SSE from the Assessment page to generate tasks."
  );
};
