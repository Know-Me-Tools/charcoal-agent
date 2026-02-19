import { useUiStore } from "@/stores/ui-store";

export function useUi() {
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const theme = useUiStore((s) => s.theme);
  const fontSize = useUiStore((s) => s.fontSize);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const setTheme = useUiStore((s) => s.setTheme);
  const setFontSize = useUiStore((s) => s.setFontSize);

  return { rightPanelOpen, theme, fontSize, toggleRightPanel, setTheme, setFontSize };
}
