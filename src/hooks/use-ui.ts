import { useUiStore } from "@/stores/ui-store";

export function useUi() {
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const theme = useUiStore((s) => s.theme);
  const fontSize = useUiStore((s) => s.fontSize);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const setTheme = useUiStore((s) => s.setTheme);
  const setFontSize = useUiStore((s) => s.setFontSize);

  return {
    rightPanelOpen,
    mobileSidebarOpen,
    theme,
    fontSize,
    toggleRightPanel,
    setMobileSidebarOpen,
    toggleMobileSidebar,
    setTheme,
    setFontSize,
  };
}
