import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../services/api.js";

export const useGoalStore = create(
  persist(
    (set, get) => ({
      // Goal state
      goals: [],
      activeGoalId: null,
      isLoadingGoals: false,
      error: null,
      // Initialization flags
      isInitialized: false,
      lastFetchedAt: null,

      // Actions
      setActiveGoal: (goalId) => {
        set({ activeGoalId: goalId });
        get().refetchCurrentPageData();
      },

      setGoals: (goals) => {
        // Remove unused fields from each goal
        const cleanedGoals = goals.map((goal) => {
          const { personalNeeds, strengths, weakness, ...rest } = goal;
          return rest;
        });
        set({ goals: cleanedGoals });
        const currentActiveGoalId = get().activeGoalId;
        if (!currentActiveGoalId && cleanedGoals.length > 0) {
          const mostRecentGoal = cleanedGoals.reduce((latest, current) => {
            const latestDate = new Date(latest.createdAt || latest._id);
            const currentDate = new Date(current.createdAt || current._id);
            return currentDate > latestDate ? current : latest;
          });
          set({ activeGoalId: mostRecentGoal._id });
        }
      },

      fetchGoals: async () => {
        set({ isLoadingGoals: true, error: null });
        try {
          const response = await api.get("/goals");
          const goals = response.data?.data || [];
          get().setGoals(goals);
          set({
            isLoadingGoals: false,
            isInitialized: true,
            lastFetchedAt: Date.now(),
          });
          return goals;
        } catch (error) {
          console.error("Error fetching goals:", error);
          let errorMessage = "Failed to fetch goals";
          if (error.response?.status === 401) {
            errorMessage = "Please log in to view your goals";
          } else if (error.response?.status === 403) {
            errorMessage = "You don't have permission to view goals";
          } else if (error.response?.status >= 500) {
            errorMessage = "Server error. Please try again later";
          } else if (!error.response) {
            errorMessage = "Network error. Please check your connection";
          } else {
            errorMessage = error.response?.data?.message || errorMessage;
          }
          set({
            error: errorMessage,
            isLoadingGoals: false,
            isInitialized: true,
          });
          return [];
        }
      },

      deleteGoal: async (goalId) => {
        set({ isLoadingGoals: true, error: null });
        try {
          await api.delete(`/goals/${goalId}`);
          const currentGoals = get().goals;
          const updatedGoals = currentGoals.filter(
            (goal) => goal._id !== goalId
          );
          const currentActiveGoalId = get().activeGoalId;
          let newActiveGoalId = currentActiveGoalId;
          if (currentActiveGoalId === goalId) {
            newActiveGoalId =
              updatedGoals.length > 0 ? updatedGoals[0]._id : null;
          }
          set({
            goals: updatedGoals,
            activeGoalId: newActiveGoalId,
            isLoadingGoals: false,
          });
          if (newActiveGoalId) {
            get().refetchCurrentPageData();
          }
          return true;
        } catch (error) {
          console.error("Error deleting goal:", error);
          set({
            error: error.response?.data?.message || "Failed to delete goal",
            isLoadingGoals: false,
          });
          throw error;
        }
      },

      setActiveGoalOnServer: async (goalId) => {
        try {
          await api.put(`/goals/${goalId}/active`);
          set({ activeGoalId: goalId });
          get().refetchCurrentPageData();
          return true;
        } catch (error) {
          console.error("Error setting active goal on server:", error);
          set({ activeGoalId: goalId });
          get().refetchCurrentPageData();
          return false;
        }
      },

      refetchCurrentPageData: () => {
        const activeGoalId = get().activeGoalId;
        if (activeGoalId) {
          window.dispatchEvent(
            new CustomEvent("goalChanged", {
              detail: { activeGoalId },
            })
          );
        }
      },

      // Getters
      getActiveGoal: () => {
        const { goals, activeGoalId } = get();
        return goals.find((goal) => goal._id === activeGoalId) || null;
      },

      hasMultipleGoals: () => {
        return get().goals.length > 1;
      },

      hasGoals: () => {
        return get().goals.length > 0;
      },

      clearGoalData: () => {
        set({
          goals: [],
          activeGoalId: null,
          isLoadingGoals: false,
          error: null,
          isInitialized: false,
          lastFetchedAt: null,
        });
      },

      initializeGoals: async () => {
        const { goals, isInitialized, lastFetchedAt } = get();
        const needFetch =
          !isInitialized ||
          goals.length === 0 ||
          !lastFetchedAt ||
          Date.now() - lastFetchedAt > 60 * 1000; // 1 min staleness window
        if (needFetch) {
          await get().fetchGoals();
        }
      },
    }),
    {
      name: "goal-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        goals: state.goals,
        activeGoalId: state.activeGoalId,
        // Don't persist volatile flags
      }),
    }
  )
);
