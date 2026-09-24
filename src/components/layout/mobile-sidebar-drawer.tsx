import { useUi } from "@/hooks/use-ui";
import { KnowMeLockup } from "@/components/brand";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileSidebarDrawerProps {
  children: React.ReactNode;
}

/** Phone thread list: a left sheet with scrim, focus trap and Escape to close. */
export function MobileSidebarDrawer({ children }: MobileSidebarDrawerProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUi();

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" closeLabel="Close threads">
        <SheetHeader>
          <KnowMeLockup variant="footer" />
          <SheetTitle className="sr-only">Threads</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
