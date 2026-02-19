import { useEffect } from "react";
import { X } from "lucide-react";
import { useUi } from "@/hooks/use-ui";

interface MobileSidebarDrawerProps {
  children: React.ReactNode;
}

export function MobileSidebarDrawer({ children }: MobileSidebarDrawerProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUi();

  // Lock body scroll when open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  if (!mobileSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setMobileSidebarOpen(false)}
      />
      {/* Drawer */}
      <aside className="absolute left-0 top-0 bottom-0 flex w-[300px] max-w-[85vw] flex-col bg-card shadow-xl transition-panel">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <span className="font-display text-base font-bold text-foreground">
            KnowMe
          </span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
