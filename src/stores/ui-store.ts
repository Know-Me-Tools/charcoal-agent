import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type FontSize = "compact" | "default" | "comfortable";

interface UiState {
  rightPanelOpen: boolean;
  theme: "dark" | "light";
  fontSize: FontSize;
  toggleRightPanel: () => void;
  setTheme: (theme: "dark" | "light") => void;
  setFontSize: (size: FontSize) => void;
}

export const useUiStore = create<UiState>()(
  immer((set) => ({
    rightPanelOpen: true,
    theme: "dark",
    fontSize: "default",

    toggleRightPanel: () =>
      set((state) => {
        state.rightPanelOpen = !state.rightPanelOpen;
      }),

    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }),

    setFontSize: (size) =>
      set((state) => {
        state.fontSize = size;
      }),
  })),
);
