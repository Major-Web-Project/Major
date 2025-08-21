import api from "./api";

// Cleanup a specific incomplete goal by goalId
export const cleanupIncompleteGoal = async (goalId) => {
  if (!goalId) throw new Error("Goal ID is required for cleanup");
  return api.post(`/goals/${goalId}/cleanup`);
};
