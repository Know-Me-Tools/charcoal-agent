import { Navigate } from "react-router-dom";
import { useThreads } from "@/hooks/use-threads";
import { EmptyState } from "@/components/common/empty-state";

export default function ThreadsPage() {
  const { data: threads, isLoading } = useThreads();

  if (isLoading) return null;

  if (threads && threads.length > 0) {
    return <Navigate to={`/threads/${threads[0].id}`} replace />;
  }

  return (
    <EmptyState
      title="No threads yet"
      description="Create one to begin."
      action={
        <p className="font-mono text-xs text-muted-foreground">
          Use the sidebar to start a new thread.
        </p>
      }
    />
  );
}
