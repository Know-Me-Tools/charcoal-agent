import { useUiStore } from "@/stores/ui-store";

export function useUi() {
  const rightPanelOpen = useUiStore((s) => s.rightPanelOpen);
  const contextSheetOpen = useUiStore((s) => s.contextSheetOpen);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const theme = useUiStore((s) => s.theme);
  const fontSize = useUiStore((s) => s.fontSize);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const setContextSheetOpen = useUiStore((s) => s.setContextSheetOpen);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const setTheme = useUiStore((s) => s.setTheme);
  const setFontSize = useUiStore((s) => s.setFontSize);

  return {
    rightPanelOpen,
    contextSheetOpen,
    mobileSidebarOpen,
    theme,
    fontSize,
    toggleRightPanel,
    setContextSheetOpen,
    setMobileSidebarOpen,
    toggleMobileSidebar,
    setTheme,
    setFontSize,
  };
}
