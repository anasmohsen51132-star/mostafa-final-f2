"use client";
// src/store/customizeStore.ts
import { create } from "zustand";
import type { SiteSettings } from "@/types";

interface CustomizeState {
  settings: Partial<SiteSettings> | null;
  isLoaded: boolean;
  setSettings: (s: Partial<SiteSettings>) => void;
  updateField: (key: keyof SiteSettings, value: string) => void;
  reset: () => void;
}

export const useCustomizeStore = create<CustomizeState>((set) => ({
  settings: null,
  isLoaded: false,

  setSettings: (s) => set({ settings: s, isLoaded: true }),

  updateField: (key, value) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, [key]: value } : { [key]: value },
    })),

  reset: () => set({ settings: null, isLoaded: false }),
}));
