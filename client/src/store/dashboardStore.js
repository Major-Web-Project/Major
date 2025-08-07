import { create } from "zustand";

export const useDashboardStore = create((set) => ({
  data: null,
  setData: (d) => set({ data: d }),
}));
