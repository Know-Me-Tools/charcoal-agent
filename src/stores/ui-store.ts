import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type Theme = "dark" | "light";
export type FontSize = "compact" | "default" | "comfortable";

/** localStorage key read by the pre-paint script in index.html — keep in sync. */
export const UI_STORAGE_KEY = "knowme:ui";

interface UiState {
  /** Inline context panel (wide screens). */
  rightPanelOpen: boolean;
  /** Context panel as a sheet below 1280px; never persisted. */
  contextSheetOpen: boolean;
  mobileSidebarOpen: boolean;
  theme: Theme;
  fontSize: FontSize;
  toggleRightPanel: () => void;
  setContextSheetOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
}

/** Reflect theme and font size on <html> (the `.dark` class drives the tokens). */
export function applyUiPreferences(theme: Theme, fontSize: FontSize): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.fontSize = fontSize;
}

export const useUiStore = create<UiState>()(
  persist(
    immer((set) => ({
      rightPanelOpen: true,
      contextSheetOpen: false,
      mobileSidebarOpen: false,
      theme: "dark",
      fontSize: "default",

      toggleRightPanel: () =>
        set((state) => {
          state.rightPanelOpen = !state.rightPanelOpen;
        }),

      setContextSheetOpen: (open) =>
        set((state) => {
          state.contextSheetOpen = open;
        }),

      setMobileSidebarOpen: (open) =>
        set((state) => {
          state.mobileSidebarOpen = open;
        }),

      toggleMobileSidebar: () =>
        set((state) => {
          state.mobileSidebarOpen = !state.mobileSidebarOpen;
        }),

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
          applyUiPreferences(theme, state.fontSize);
        }),

      setFontSize: (size) =>
        set((state) => {
          state.fontSize = size;
          applyUiPreferences(state.theme, size);
        }),
    })),
    {
      name: UI_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only preferences persist; panel/drawer state is per session.
      partialize: (state) => ({ theme: state.theme, fontSize: state.fontSize }),
      onRehydrateStorage: () => (state) => {
        if (state) applyUiPreferences(state.theme, state.fontSize);
      },
    },
  ),
);
